import { z } from 'zod';
import { MONITORING_EVENT_TYPES, MONITORING_MAX_BATCH } from '@/lib/attempts/monitoring-contract';

// Strict at both levels: clipboard data, identity overrides, scores, and device
// metadata never enter the monitoring store.
export const monitoringEventSchema = z.object({
  clientEventId: z.string().uuid().transform(value => value.toLowerCase()),
  eventType: z.enum(MONITORING_EVENT_TYPES),
  clientTimestamp: z.string().datetime({ offset: true }).optional(),
  sequence: z.number().int().min(0).max(2_147_483_647).optional(),
}).strict();

export const monitoringBatchSchema = z.object({
  events: z.array(monitoringEventSchema).min(1).max(MONITORING_MAX_BATCH),
}).strict();

export type MonitoringBatch = z.infer<typeof monitoringBatchSchema>;
