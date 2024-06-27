import { redisClient } from "../src/utils/redisClient";
console.log("开始清理奖池数据...");
await redisClient.del(`{moneyPool}:game`);

console.log("奖池数据清理完毕");

process.exit(0);
