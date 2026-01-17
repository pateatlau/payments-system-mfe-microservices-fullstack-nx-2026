// Query monitoring exports
export {
  createQueryMonitorMiddleware,
  getQueryStats,
  resetQueryStats,
  getAllQueryStats,
  formatQueryStats,
  getQueryMonitorConfigFromEnv,
} from './lib/query-monitor';

export type {
  QueryMonitorConfig,
  SlowQueryInfo,
  QueryTimeoutInfo,
  QueryStats,
} from './lib/query-monitor';

// Field encryption exports (Phase 4.3 - Data Encryption)
export {
  FieldEncryptionManager,
  createFieldEncryptionMiddleware,
  createFieldEncryptionManagerFromEnv,
  generateFieldEncryptionKey,
} from './lib/field-encryption';

export type {
  FieldEncryptionConfig,
  FieldEncryptionAuditEvent,
  EncryptedFieldConfig,
  ModelEncryptionConfig,
  EncryptedValue,
} from './lib/field-encryption';
