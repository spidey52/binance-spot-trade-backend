import { Redis } from "ioredis";
import exchange from "../lib/exchange.conn";

const redisClient = new Redis();
export const subscriberClient = redisClient.duplicate();



export const getFcmToken = async () => {
 const token = await redisClient.get("fcmToken");
 return token;
};

export const setFcmToken = async (token: string) => {
 await redisClient.set("fcmToken", token);
};

export default redisClient;
