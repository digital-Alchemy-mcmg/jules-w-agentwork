import { processLiveJobToEnvelope } from './src/services/scoutEngine.ts';

async function main() {
  const testJob = {
    id: "TEST-001",
    title: "Operations Supervisor",
    company: "Apex Tech",
    location: "Novi, MI",
    payType: "Salary",
    employmentType: "Full-time",
    rawSourceText: "Operations Supervisor at Apex Tech. Supervise floor operations."
  };

  const { candidate, envelope } = await processLiveJobToEnvelope(testJob);
  console.log("envPassed", candidate.status === 'ACCEPTED' &&
    envelope?.stage_state.current_stage === 'b' &&
    envelope?.payload.scout.original_target_source.is_preserved_source === true &&
    envelope?.payload.scout.original_target_source.source_hash.startsWith('sha256:'));
}
main().catch(console.error);
