import { handleInternalError } from "./error/error.handler";
import * as dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import express, { Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";

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

import { notificationRoutes, orderRoutes, reportRoutes, tickerRoutes, tradeRoutes, userRoutes } from "./routes";
import autoTradeSync from "./lib/trade.sync";
import redisClient, { getFcmToken, setFcmToken, subscriberClient } from "./redis/redis_conn";
// import futureTradeStream from "./lib/future.stream";
import futureTradeStream from "./lib/future.stream";
import binanceRouter from "./routes/binance.routes";
import { futureExchange } from "./lib/utils/order.future";
import { handleCustomNotification } from "./lib/utils/notificationHandler";
import { send } from "process";

const env = process.env.NODE_ENV;
if (!env) {
 console.log("No environment found");
 process.exit(1);
}
if (env === "production") {
 autoTradeSync();
 futureTradeStream();
}

redisClient.on("connect", () => {
 console.log("Redis client connected");
});

app.post("/fcm", async (req: Request, res: Response) => {
 const { token } = req.body;
 const tokenMiddle = token.slice(0, 10);
 console.log(tokenMiddle, "tokenMiddle");

 try {
  await setFcmToken(token, tokenMiddle);
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

const PORT = process.env.PORT || 9001;

app.listen(PORT, () => {
 console.log("Server started on port 9001");
});

const sendMe = async () => {
 const tokens = await getFcmToken();

 const payload = {
  notification: {
   title: "Hello",
   body: "Hello",
  },
 };

 handleCustomNotification({ title: "Hello", body: "Hello" });
};
