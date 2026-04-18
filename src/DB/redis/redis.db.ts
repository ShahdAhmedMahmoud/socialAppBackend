
import { createClient } from "redis";
import { REDIS_URL } from "../../config/config.service.js";


export const redisClient = createClient({
  url: REDIS_URL
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("error", (err) => {
  console.log("Redis Error:", err);
});

redisClient.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

export const redisConnection = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.log("Redis connection error:", error);
  }
};