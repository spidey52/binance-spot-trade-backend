import { Redis } from "ioredis";
import moment from "moment";
import { WebSocket } from "ws";

const redisClient = new Redis();
export const subscriberClient = redisClient.duplicate();

export const getFcmToken = async () => {
 try {
  const keys = await redisClient.keys("fcmToken:*");
  if (!keys.length) return [];
  const tokens = await redisClient.mget(keys);

  const result: string[] = [];

  for (let token of tokens) {
   if (token) result.push(token);
  }

  return result;
 } catch (error) {
  const token = await redisClient.get("fcmToken");
  return token ? [token] : [];
 }
};

export const setFcmToken = async (token: string, prefix?: string) => {
 const fourHour = 60 * 60 * 4;

 if (prefix) {
  await redisClient.set(`fcmToken:${prefix}`, token, "EX", fourHour);
 } else {
  await redisClient.set("fcmToken", token);
 }
};

const initializeTickerSocket = () => {
 const socket = new WebSocket("wss://stream.binance.com:9443/ws/!miniTicker@arr");
 socket.on("message", async (data: any) => {
  const jsonData = JSON.parse(data.toString());

  const obj: any = {};

  for (let ticker of jsonData) {
   obj[ticker.s] = ticker.c;
  }

  console.log(`Ticker updated at ${moment().format("DD-MM-YYYY HH:mm:ss")}`);

  await redisClient.hset("satyam-coins", obj);
 });

 socket.on("close", () => {
  return initializeTickerSocket();
 });
};

initializeTickerSocket();

export default redisClient;
