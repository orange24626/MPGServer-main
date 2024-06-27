import { createClient } from "redis";
// import Redis from "ioredis";
import { getRedisURL } from "config";

export const redisClient = createClient({
  url: getRedisURL(),
});

export const connectRedis = async () => {
  await redisClient.connect();
};
