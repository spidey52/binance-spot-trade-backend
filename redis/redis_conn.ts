import { Redis } from "ioredis";
import { json } from "stream/consumers";
import { WebSocket } from "ws";

const redisClient = new Redis();
export const subscriberClient = redisClient.duplicate();

export const getFcmToken = async () => {
 const token = await redisClient.get("fcmToken");

 if (!token) return [];
 return [token];
};

export const setFcmToken = async (token: string) => {
 await redisClient.set("fcmToken", token);
};

const socket = new WebSocket("wss://stream.binance.com:9443/ws/!miniTicker@arr");
socket.on("message", async (data: any) => {
 const jsonData = JSON.parse(data.toString());

 const obj: any = {};

 for (let ticker of jsonData) {
  obj[ticker.s] = ticker.c;
 }

 await redisClient.hset("satyam-coins", obj);
});

export default redisClient;
