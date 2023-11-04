import { Redis } from "ioredis";
import { json } from "stream/consumers";
import { WebSocket } from "ws";

const redisClient = new Redis();
export const subscriberClient = redisClient.duplicate();

export const getFcmToken = async () => {
 try {
  const keys = await redisClient.keys("fcmToken:*");
  if (!keys.length) return [];
  const tokens = await redisClient.mget(keys);

  return tokens;
 } catch (error) {
  const token = await redisClient.get("fcmToken");
  return token ? [token] : [];
 }
};

export const setFcmToken = async (token: string, prefix?: string) => {
 //  const tokens = await redisClient.set("fcmToken", token);

 if (prefix) {
  await redisClient.set(`fcmToken:${prefix}`, token);
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

  await redisClient.hset("satyam-coins", obj);
 });

 socket.on("close", () => {
  return initializeTickerSocket();
 });
};

initializeTickerSocket();

export default redisClient;
