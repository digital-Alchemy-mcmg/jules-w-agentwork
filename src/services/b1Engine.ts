import { TravelingEnvelope } from '../types/scout';

export function processB1Stage(envelope: TravelingEnvelope): TravelingEnvelope {
  if (envelope.stage_state.current_stage !== 'b') {
    throw new Error('Invalid stage state: Expected current_stage to be "b"');
  }

  // Deep clone to ensure immutability of the upstream envelope
  const clonedEnvelope: TravelingEnvelope = JSON.parse(JSON.stringify(envelope));

  const sourceText = clonedEnvelope.payload.scout.original_target_source.source_text;

  clonedEnvelope.payload.b1 = {
    processed_source_text: sourceText
  };

  clonedEnvelope.stage_state.current_stage = 'b1' as any;
  clonedEnvelope.stage_state.completed_stages.push('b1' as any);

  return clonedEnvelope;
}
