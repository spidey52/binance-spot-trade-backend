import cors from "cors";
import * as dotenv from "dotenv";
import express, { Request, Response } from "express";
import fs from "fs/promises";
import mongoose from "mongoose";
import morgan from "morgan";
import { handleInternalError } from "./error/error.handler";
dotenv.config();

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors());

const db = process.env.MONGO_URI;
if (!db) {
 console.log("No database found");
 process.exit(1);
}

mongoose.set("strictQuery", true);

mongoose
 .connect(db)
 .then(() => {
  console.log("Connected to MongoDB");
 })
 .catch((err) => {
  console.log(err.message);
 });

import moment from "moment";
import myenv from "./config/myenv.config";
import startCron from "./cron/start.cron";
import futureTradeStream from "./lib/future.stream";
import autoTradeSync from "./lib/trade.sync";
import FutureTickerModel from "./models/future/future.ticker.models";
import redisClient from "./redis/redis_conn";
import { notificationRoutes, orderRoutes, reportRoutes, tickerRoutes, tradeRoutes, userRoutes } from "./routes";
import binanceRouter from "./routes/binance.routes";
import priceListenerRouter from "./routes/price.listener.routes";

if (myenv.isProdMode) {
 autoTradeSync();
 futureTradeStream();
}

redisClient.on("connect", () => {
 console.log("Redis client connected");
});

app.post("/fcm", async (req: Request, res: Response) => {
 try {
  const { token } = req.body;
  await redisClient.sadd("fcmToken", token);

  redisClient.hset("fcmToken", token, moment().format("DD-MM-YYYY HH:mm:ss"));

  return res.status(200).send({ message: "Token saved" });
 } catch (error: any) {
  return handleInternalError(req, res, error);
 }
});

app.use("/users", userRoutes);
app.use("/trades", tradeRoutes);
app.use("/tickers", tickerRoutes);
app.use("/orders", orderRoutes);
app.use("/reports", reportRoutes);
app.use("/notifications", notificationRoutes);
app.use("/binance", binanceRouter);
app.use("/price-listeners", priceListenerRouter);

const PORT = process.env.PORT || 9001;

// app.listen(PORT, () => {
//  console.log("Server started on port 9001");
// });
const main = async () => {
 await setMaxPendingOrders();
 app.listen(PORT, () => {
  console.log("Server started on port 9001");
 });
};

app.post("/servers", async (req, res) => {
 try {
  const { auth } = req.body;
  const filePath = "./servers.json";

  const content = await fs.readFile(filePath, "utf8");
  const servers = JSON.parse(content);

  if (!servers[auth]) return res.status(401).send({ message: "Invalid auth" });

  const keys = servers[auth];

  type KeyValue = {
   [key: string]: string;
  };

  const obj: KeyValue = {};

  for (let key of keys) {
   obj[key] = servers[key];
  }

  return res.status(200).send(obj);

  // return res.status(200).send(obj);
 } catch (error) {
  return handleInternalError(req, res, error);
 }
});

const setMaxPendingOrders = async () => {
 await FutureTickerModel.updateMany(
  {
   maxPendingOrders: { $exists: false },
  },
  { maxPendingOrders: 10 }
 );
};
main();

// handleTelegramNotification({ title: "Server Started", body: "Server started on port 9001" });

//  simulate a trading platform

type Balance = {
 total: number;
 available: number;
 inOrder: number;
};

type Leverage = {
 symbol: string;
 leverage: number;
};

type Order = {
 orderId: string;
 symbol: string;
 side: "BUY" | "SELL";
 price: number;
 quantity: number;
};

type Position = {
 symbol: string;
 entryPrice: number;
 quantity: number;
};

type Trade = {
 symbol: string;
 buyPrice: number;
 sellPrice: number;
 profit: number;
 quantity: number;
};

const initialBalance: Balance = {
 total: 1000,
 available: 1000,
 inOrder: 0,
};

const initialLeverage: Leverage = {
 symbol: "BTCUSDT",
 leverage: 4,
};

const initialPosition: Position = {
 symbol: "BTCUSDT",
 entryPrice: 60000,
 quantity: 0.002,
};

const initialTrade: Trade = {
 symbol: "BTCUSDT",
 buyPrice: 40000,
 sellPrice: 41000,
 profit: 100,
 quantity: 0.1,
};

const balance: Balance = { ...initialBalance };
const leverage: Leverage = { ...initialLeverage };
const position: Position = { ...initialPosition };

const orders: Order[] = [];
const trades: Trade[] = [];

const isSellOrderAllowed = (symbol: string, quantity: number) => {
 const currSellQty = orders.reduce((acc, order) => {
  if (order.side === "SELL") {
   acc += order.quantity;
  }
  return acc;
 }, 0);

 const availableToSell = position.quantity - currSellQty;

 if (availableToSell < quantity) return false;

 return true;
};

const createOrder = (order: Order) => {
 if (order.side === "SELL") {
  const isAllowed = isSellOrderAllowed(order.symbol, order.quantity);
  if (!isAllowed) return;
 }

 orders.push(order);
 if (order.side === "BUY") {
  balance.available -= order.price * order.quantity;
  balance.inOrder += order.price * order.quantity;
 }
};

const cancelOrder = (orderId: string) => {
 const order = orders.findIndex((order) => order.orderId === orderId);
};

/*
  1. consider number of pending orders.. so that we will not run out of balance
  2. consider leverage
*/

if (!myenv.isDevMode) {
 startCron();
}
