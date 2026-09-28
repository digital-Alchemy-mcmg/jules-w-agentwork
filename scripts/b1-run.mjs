import './b1-loader.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { ingestB1, B1Halt } = await import('../src/services/b1Engine.ts');

export async function runB1Files(inputPath, outputPath) {
  const output = await ingestB1(JSON.parse(await readFile(inputPath, 'utf8')));
  // Exclusive create: never overwrite the source envelope or an existing result.
  await writeFile(outputPath, JSON.stringify(output, null, 2) + '\n', { flag: 'wx' });
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/b1-run.mjs scout-envelope.json b1-envelope.json');
  process.exitCode = 2;
} else {
  try {
    const output = await runB1Files(inputPath, outputPath);
    console.log(JSON.stringify({ status: 'completed', current_stage: output.stage_state.current_stage,
      output: outputPath, source_hash: output.payload.scout.original_target_source.source_hash }));
  } catch (error) {
    console.error(JSON.stringify(error instanceof B1Halt
      ? { status: 'halted', code: error.code, diagnostic: error.diagnostic }
      : { status: 'halted', message: String(error) }));
    process.exitCode = 1;
  }
}
}
