import { handleCustomNotification } from "./lib/utils/notificationHandler";
import { handleInternalError } from "./error/error.handler";
import * as dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import express from "express";
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
import redisClient, { setFcmToken } from "./redis/redis_conn";
import futureTradeStream from "./lib/future.stream";

const env = process.env.NODE_ENV;
if (!env) {
 console.log("No environment found");
 process.exit(1);
}
if (env === "production") {
 autoTradeSync();
}

futureTradeStream()

redisClient.on("connect", () => {
 console.log("Redis client connected");
});

app.post("/fcm", async (req, res) => {
 const { token } = req.body;

 try {
  await setFcmToken(token);
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

app.listen(9001, () => {
 console.log("Server started on port 9001");
});
