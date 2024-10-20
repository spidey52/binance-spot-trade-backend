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
import handleAutoPlaceOrder from "./lib/auto_place_order";
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
  if (!token) return res.status(200).send({ message: "Token is required" });

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

if (!myenv.isDevMode) {
 startCron();
}

let autoHandler = process.env.AUTO_HANDLER;
if (autoHandler) {
 setInterval(() => {
  handleAutoPlaceOrder("SOLUSDT", { side: "buy" });
 }, +autoHandler * 60);
}
