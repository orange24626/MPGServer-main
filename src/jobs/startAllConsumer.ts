// import { SystemEventRecordQueue } from "utils";
import { SystemEventRecordQueue } from "utils/queues";
import { dealSystemEventRecordJob } from "./";

export async function startAllConsumer() {
  console.log("startAllConsumer===============");
  // await SystemEventRecordQueue.process(dealSystemEventRecordJob);
}
