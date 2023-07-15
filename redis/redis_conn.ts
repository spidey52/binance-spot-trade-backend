import { Redis } from "ioredis";
import exchange from "../lib/exchange.conn";
import { randomBytes } from "crypto";

const redisClient = new Redis();
export const subscriberClient = redisClient.duplicate();

export const getFcmToken = async () => {
 //  const token = await redisClient.get("fcmToken");
 const allKeys = await redisClient.keys("fcmToken*");

 let token: string[] = [];

 for (const key of allKeys) {
  const value = await redisClient.get(key);
  if (value) token.push(value);
  else {
   await redisClient.del(key);
  }
  //  console.log(value);
  //  console.log(key);
  //  console.log(token);
  //  console.log("====================================");
  //  console.log("==================
 }

	return token;
};

export const setFcmToken = async (token: string) => {
 const key = randomBytes(8).toString("hex");
 await redisClient.set("fcmToken" + key, token, "EX", 60 * 60 * 24);
};

export default redisClient;
