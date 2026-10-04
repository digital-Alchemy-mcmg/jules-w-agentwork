import './b1-loader.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const { processLiveJobToEnvelope } = await import('../src/services/scoutEngine.ts');

// Synthetic test target, not a real posting, preserved through the actual Scout engine.
const rawSourceText = [
  'Company: B1 Demo Manufacturing', 'Job title: Operations Manager',
  'Application URL: https://example.org/apply/demo',
  'Candidates must have a safety certification.',
  '3 years of experience preferred.', 'Responsibilities:',
  'Maintain 2 production lines; coordinate daily inspections.',
].join('\r\n');
const { envelope } = await processLiveJobToEnvelope({ id: 'B1-DEMO', title: 'Operations Manager',
  company: 'B1 Demo Manufacturing', location: '', payType: '', employmentType: '',
  sourceUrl: 'https://example.org/apply/demo', rawSourceText });
if (!envelope) throw new Error('Scout rejected the synthetic fixture');
const directory = process.argv[2] || '.b1-execution';
await mkdir(directory, { recursive: true });
const file = join(directory, 'scout-envelope.json');
await writeFile(file, JSON.stringify(envelope, null, 2) + '\n', { flag: 'wx' });
console.log(file);
