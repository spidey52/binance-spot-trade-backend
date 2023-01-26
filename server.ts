import { getTickersList } from "./redis/ticker.redis";
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

import {
 notificationRoutes,
 orderRoutes,
 reportRoutes,
 tickerRoutes,
 tradeRoutes,
 userRoutes,
} from "./routes";
import autoTradeSync from "./lib/trade.sync";

// autoTradeSync();

app.use("/users", userRoutes);
app.use("/trades", tradeRoutes);
app.use("/tickers", tickerRoutes);
app.use("/orders", orderRoutes);
app.use("/reports", reportRoutes);
app.use("/notifications", notificationRoutes);

app.listen(9001, () => {
 console.log("Server started on port 9001");
});
