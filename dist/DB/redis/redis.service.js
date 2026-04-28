import { emailEnum } from "../../common/enum/email.enum.js";
import { redisClient } from "./redis.db.js";
export const revoked_key = ({ userId, jti }) => {
    return `revokedToken::${userId}::${jti}`;
};
export const get_key = ({ userId }) => {
    return `revokedToken::${userId}`;
};
export const otp_key = ({ email, subject = emailEnum.confirmEmail, }) => {
    return `otp::${email}::${subject}`;
};
export const max_otp_key = ({ email }) => {
    return `otp::${email}::max_tries`;
};
export const block_otp_key = ({ email }) => {
    return `otp::${email}::blocked`;
};
export const set = async ({ key, value, ttl } = {}) => {
    try {
        const data = typeof value === "string" ? value : JSON.stringify(value);
        return ttl
            ? await redisClient.set(key, data, { EX: ttl })
            : await redisClient.set(key, data);
    }
    catch (err) {
        console.log("Error occurred while setting Redis value:", err);
    }
};
export const update = async ({ key, value, ttl } = {}) => {
    try {
        if (!(await redisClient.exists(key))) {
            return 0;
        }
        const data = typeof value === "string" ? value : JSON.stringify(value);
        return ttl
            ? await redisClient.set(key, data, { EX: ttl })
            : await redisClient.set(key, data);
    }
    catch (err) {
        console.log("Error occurred while updating Redis value:", err);
    }
};
export const get = async (key) => {
    try {
        const data = await redisClient.get(key);
        try {
            return JSON.parse(data);
        }
        catch {
            return data;
        }
    }
    catch (err) {
        console.log("Error occurred while getting Redis value:", err);
    }
};
export const exists = async (key) => {
    try {
        return await redisClient.exists(key);
    }
    catch (err) {
        console.log("Error occurred while checking Redis key existence:", err);
    }
};
export const ttl = async (key) => {
    try {
        return await redisClient.ttl(key);
    }
    catch (err) {
        console.log("Error occurred while checking Redis key TTL:", err);
    }
};
export const del = async (key) => {
    try {
        return await redisClient.del(key);
    }
    catch (err) {
        console.log("Error occurred while deleting Redis value:", err);
    }
};
export const keys = async (pattern = "*") => {
    try {
        return await redisClient.keys(`${pattern}`);
    }
    catch (err) {
        console.log("Error occurred while fetching Redis keys:", err);
    }
};
export const incr = async (key) => {
    try {
        return await redisClient.incr(key);
    }
    catch (err) {
        console.log("Error occurred while incrementing Redis value:", err);
    }
};
