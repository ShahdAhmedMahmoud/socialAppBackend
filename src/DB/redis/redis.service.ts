import { emailEnum, type EmailEnum } from "../../common/enum/email.enum.js";
import { redisClient } from "./redis.db.js";



export interface RevokedKeyParams {
  userId: string;
  iti: string;
}

export interface UserKeyParams {
  userId: string;
}

export interface OtpKeyParams {
  email: string;
  subject?: EmailEnum;
}

export interface EmailKeyParams {
  email: string;
}

export const revoked_key = ({ userId, iti }: RevokedKeyParams): string => {
  return `revokedToken::${userId}::${iti}`;
};

export const get_key = ({ userId }: UserKeyParams): string => {
  return `revokedToken::${userId}`;
};

export const otp_key = ({
  email,
  subject = emailEnum.confirmEmail,
}: OtpKeyParams): string => {
  return `otp::${email}::${subject}`;
};

export const max_otp_key = ({ email }: EmailKeyParams): string => {
  return `otp::${email}::max_tries`;
};

export const block_otp_key = ({ email }: EmailKeyParams): string => {
  return `otp::${email}::blocked`;
};

// --- Core Redis Operations ---

export interface SetParams {
  key: string;
  value: string | object | number;
  ttl?: number;
}

export const set = async ({ key, value, ttl }: SetParams = {} as SetParams): Promise<string | null | undefined> => {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);
    return ttl
      ? await redisClient.set(key, data, { EX: ttl })
      : await redisClient.set(key, data);
  } catch (err) {
    console.log("Error occurred while setting Redis value:", err);
  }
};

export const update = async ({ key, value, ttl }: SetParams = {} as SetParams): Promise<string | number | null | undefined> => {
  try {
    if (!(await redisClient.exists(key))) {
      return 0;
    }
    const data = typeof value === "string" ? value : JSON.stringify(value);
    return ttl
      ? await redisClient.set(key, data, { EX: ttl })
      : await redisClient.set(key, data);
  } catch (err) {
    console.log("Error occurred while updating Redis value:", err);
  }
};

export const get = async <T = unknown>(key: string): Promise<T | string | null | undefined> => {
  try {
    const data = await redisClient.get(key);
    try {
      return JSON.parse(data as string) as T;
    } catch {
      return data;
    }
  } catch (err) {
    console.log("Error occurred while getting Redis value:", err);
  }
};

export const exists = async (key: string): Promise<number | undefined> => {
  try {
    return await redisClient.exists(key);
  } catch (err) {
    console.log("Error occurred while checking Redis key existence:", err);
  }
};

export const ttl = async (key: string): Promise<number | undefined> => {
  try {
    return await redisClient.ttl(key);
  } catch (err) {
    console.log("Error occurred while checking Redis key TTL:", err);
  }
};

export const del = async (key: string): Promise<number | undefined> => {
  try {
    return await redisClient.del(key);
  } catch (err) {
    console.log("Error occurred while deleting Redis value:", err);
  }
};

export const keys = async (pattern: string = "*"): Promise<string[] | undefined> => {
  try {
    return await redisClient.keys(`${pattern}`);
  } catch (err) {
    console.log("Error occurred while fetching Redis keys:", err);
  }
};

export const incr = async (key: string): Promise<number | undefined> => {
  try {
    return await redisClient.incr(key);
  } catch (err) {
    console.log("Error occurred while incrementing Redis value:", err);
  }
};