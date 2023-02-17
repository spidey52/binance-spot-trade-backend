import { Redis } from "ioredis";
import exchange from "../lib/exchange.conn";

const redisClient = new Redis();

exchange.fetchBalance().then((balance) => {
 const total = balance.total;

 for (const [key, value] of Object.entries(total)) {
  if (value === 0) continue;
  const keyString = key.toString();
  const valueString = value.toString();
  console.log(keyString, valueString);
 }

 const keys = Object.keys(balance.free);
 const values = Object.values(balance.free);
});

export const getFcmToken = async () => {
 const token = await redisClient.get("fcmToken");
 return token;
};

export const setFcmToken = async (token: string) => {
 await redisClient.set("fcmToken", token);
};

export default redisClient;
