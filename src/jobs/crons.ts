import { CronJob } from "cron";
import { prismaClient } from "utils";

//每1分钟执行一次
export const ClearExpiredMachinesJob = new CronJob(
  "0 */3 * * * *",
  async function () {
    console.log("清理奖池, 3分钟执行一次");
  }, // onTick
  null, // onComplete
  false, // start
  "America/Los_Angeles", // timeZone
);
