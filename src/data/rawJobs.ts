import { RawJobInput } from '../types/scout';

/**
 * Cleanroom raw job repository.
 * Zero hardcoded legacy training data or Method Hospitality anchors.
 * Populated dynamically via the Live Ingestion interface or direct injection.
 */
export const INITIAL_RAW_JOBS: RawJobInput[] = [];
