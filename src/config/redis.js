import Redis from "ioredis";
import { logger } from "../utils/logger.js";

const redis = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    db: Number(process.env.REDIS_DB || 0),
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    connectTimeout: 5000,

    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 50, 2000);
    },

    reconnectOnError: (err) => {
      if (err.message.includes("READONLY")) {
        return true;
      }
      return false;
    },
  }
);

redis.on("connect", () => {
  logger.info("Redis client connected");
});

redis.on("ready", () => {
  logger.info("Redis client ready");
});

redis.on("error", (err) => {
  logger.error("Redis connection error:", err.message);
});

redis.on("close", () => {
  logger.warn("Redis connection closed");
});

redis.on("reconnecting", () => {
  logger.info("Redis reconnecting...");
});

export default redis;
