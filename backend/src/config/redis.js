import { Redis as UpstashRedis } from "@upstash/redis";
import IORedis from "ioredis";

// @upstash/redis REST client — use this for direct get/set/del operations
export const redis = new UpstashRedis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ioredis over TLS — required by BullMQ
export const bullRedisConnection = new IORedis({
  host: process.env.UPSTASH_REDIS_HOST,
  port: Number(process.env.UPSTASH_REDIS_PORT) || 6379,
  password: process.env.UPSTASH_REDIS_PASSWORD,
  username: "default",
  tls: {
    rejectUnauthorized: false,
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectTimeout: 10000,
});

bullRedisConnection.on("connect", () => {
  console.log("BullMQ Redis connected");
});

bullRedisConnection.on("error", (err) => {
  console.error("BullMQ Redis error:", err.message);
});