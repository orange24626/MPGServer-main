import { Job, Queue, Worker } from "bullmq";
import { getRedisURL } from "config";

export const SYSTEM_EVENT_RECORD = "SYSTEM_EVENT_RECORD";
export const HISTORY_SAVER = "HISTORY_SAVER";
export const MONEY_POOL_PUTTER = "MONEY_POOL_PUTTER";

export const SystemEventRecordQueue = new Queue(SYSTEM_EVENT_RECORD, {
  connection: {
    path: getRedisURL(),
  },
  prefix: "{system_event_record}",
});
