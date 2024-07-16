import { Redis, RedisOptions } from "ioredis";
import moment from "moment";
import { WebSocket } from "ws";
import myenv from "../config/myenv.config";
import { IPriceListener } from "../models/future/price.listener.models";
import handlePriceListener from "../price_listener.handler";
import appSettings from "../settings";

const config: RedisOptions = {
 keyPrefix: `${myenv.SERVER_NAME.toUpperCase()}:`,
};

export const redisClient = new Redis(config);

export const sellHandlerClient = new Redis(config);
export const buyHandlerClient = new Redis(config);

export const getFcmToken = async () => {
 try {
  const tokens: string[] = await redisClient.smembers("fcmToken");
  return tokens;
 } catch (error) {
  return [];
 }
};

const priceListeners: IPriceListener[] = [];

const initializeTickerSocket = () => {
 const socket = new WebSocket("wss://stream.binance.com:9443/ws/!miniTicker@arr");
 socket.on("message", async (data: any) => {
  const jsonData = JSON.parse(data.toString());

  const obj: any = {};

  for (let ticker of jsonData) {
   obj[ticker.s] = +ticker.c;
  }

  if (appSettings.priceListenerLog) console.log(`Ticker updated at ${moment().format("DD-MM-YYYY HH:mm:ss")}`);

  await redisClient.hset("satyam-coins", obj);
  const perf = performance.now();
  await handlePriceListener(obj);
  const perf2 = performance.now();

  if (appSettings.priceListnerPerfLog) console.log(`Price Listener took ${(perf2 - perf).toFixed(2)} milliseconds`);
 });

 socket.on("close", () => {
  return initializeTickerSocket();
 });
};

initializeTickerSocket();

export default redisClient;
