import { redisClient } from "../src/utils/redisClient";

await redisClient.connect();

await redisClient.flushDb();

console.log("reset redis done");
process.exit(0);
