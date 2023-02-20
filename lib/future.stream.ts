import { handleCustomNotification } from "./utils/notificationHandler";
import axios from "axios";
import WebSocket from "ws";
import FutureTradeModel from "../models/future.trade.models";

const futureTradeStream = async () => {
 let listenerKey = "";
 const getListenerkey = async () => {
  try {
   const { data } = await axios.post("https://fapi.binance.com/fapi/v1/listenKey", null, {
    headers: {
     "X-MBX-APIKEY": process.env.API_KEY,
    },
   });
   listenerKey = data.listenKey;
  } catch (error: any) {
   console.log(error.message);
  }
 };

 await getListenerkey();

 const ws = new WebSocket("wss://fstream.binance.com/ws/" + listenerKey);

 ws.on("open", () => {
  console.log("Binace WebSocket Connected", new Date().toLocaleString());
 });

 ws.on("message", async (data) => {
  const parsedData = JSON.parse(data.toString());
  console.log(parsedData);

  // const {i: orderId, s: symbol, p: price, q: quantity, S: side, X: executionType,  } = parsedData;
  try {
   const { i: orderId, s: symbol, p: price, q: quantity, S: side, X: executionType, rp } = parsedData;

   if (executionType === "TRADE") {
    const realizedProfit = Number(rp);
    try {
     await handleCustomNotification({
      title: "New Future Trade",
      body: `Symbol: ${symbol} | Side: ${side} | Price: ${price} | Quantity: ${quantity} | Realized Profit: ${realizedProfit}`,
     });
    } catch (error: any) {
     console.log(error.message, "future trade stream");
    }
    if (realizedProfit === 0) return;

    await FutureTradeModel.create({
     user: "63beffd81c1312d53375a43f",
     orderId,
     symbol,
     realizedProfit,
     date: new Date(),
    });
   }
  } catch (error: any) {
   console.log(error.message, "future trade stream");
  }
 });

 const intervalId = setInterval(() => {
  ws.close();
 }, 1000 * 60 * 30);

 ws.on("close", () => {
  console.log("Binace WebSocket Disconnected", new Date().toLocaleString());
  clearInterval(intervalId);
  futureTradeStream();
 });
};

export default futureTradeStream;
