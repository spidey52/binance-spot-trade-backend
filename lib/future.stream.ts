import axios from "axios";
import WebSocket from "ws";
import FutureTickerModel from "../models/future/future.ticker.models";
import redisClient, { buyHandlerClient, sellHandlerClient } from "../redis/redis_conn";
import buyHandler from "./buy_handler";
import notificationEvent from "./event/notification.event";
import sellHandler from "./sell_handler";
import AsyncQueue from "./utils/myqueue";

// const buyQueue = new AsyncQueue();
// const sellQueue = new AsyncQueue();
const myQueue = new Map<string, AsyncQueue>();

const futureTradeStream = async () => {
 let listenerKey = "";
 const getListenerkey = async () => {
  try {
   const { data } = await axios.post("https://fapi.binance.com/fapi/v1/listenKey", null, {
    headers: {
     "X-MBX-APIKEY": process.env.FUTURE_API_KEY,
    },
   });
   listenerKey = data.listenKey;
  } catch (error: any) {
   console.log(error.message, error?.response?.data);
  }
 };

 await getListenerkey();

 const ws = new WebSocket("wss://fstream.binance.com/ws/" + listenerKey);

 ws.on("open", () => {
  console.log("Binace Future WebSocket Connected", new Date().toLocaleString());
 });

 ws.on("message", async (data) => {
  const str = data.toString();
  const parsedData = JSON.parse(str);

  await redisClient.lpush("future:stream", str);

  try {
   // let flag: any = JSON.parse(data.toString());
   // if (flag.e === "ACCOUNT_CONFIG_UPDATE") {
   //  await updateAccountSettings(flag);
   // } else if (flag.e == "ORDER_TRADE_UPDATE") {
   //  let trade: ITradeInfo = flag.o;
   //  let coin = await redisClient.get(trade.s);
   //  if (!coin) return;
   //  let coinObj: ICoins = JSON.parse(coin);
   //  if (trade.x === "TRADE" && trade.X === "FILLED") {
   //   if (trade.S === "BUY") {
   //    await buyHandler(coinObj, trade);
   //   } else if (trade.S === "SELL") {
   //    await sellHandler(coinObj, trade);
   //   }
   //  }
   // }

   if (parsedData.e === "ACCOUNT_CONFIG_UPDATE") {
    // update account settings
   } else if (parsedData.e === "ORDER_TRADE_UPDATE") {
    let trade: any = parsedData.o;

    // if (trade.x === "NEW") {
    //  addOpenOrder(trade.s, trade.i + "", trade.p, trade.S.toLowerCase());
    // } else if (trade.x === "CANCELED") {
    //  deleteOpenOrder(trade.s, trade.i + "");
    // } else if (trade.x === "REJECTED") {
    //  deleteOpenOrder(trade.s, trade.i + "");
    // } else if (trade.x === "TRADE") {
    //  deleteOpenOrder(trade.s, trade.i + "");
    // }

    if (trade.x === "TRADE" && trade.X === "FILLED") {
     const ticker = await FutureTickerModel.findOne({ symbol: trade.s }).lean();
     if (!ticker) return console.log("Ticker not found");
     if (ticker.ignoreStream) return notificationEvent.emit("notification", { title: "Trade Ignored", body: `Trade ignored for ${trade.s}` });

     if (trade.S === "BUY") {
      // await buyHandler(trade);
      // const buyQueue = myQueue.get(trade.s) || new AsyncQueue();
      // let buyQueue = myQueue.get(trade.s);
      // if (!buyQueue) {
      //  buyQueue = new AsyncQueue();
      //  myQueue.set(trade.s, buyQueue);
      // }
      // await buyQueue.enqueue(async () => {
      //  await buyHandler(trade);
      // });

      await redisClient.lpush("future:buy-stream", JSON.stringify(trade));
     } else if (trade.S === "SELL") {
      // await sellHandler(trade);
      // let sellQueue = myQueue.get(trade.s);
      // if (!sellQueue) {
      //  sellQueue = new AsyncQueue();
      //  myQueue.set(trade.s, sellQueue);
      // }
      // await sellQueue.enqueue(async () => {
      //  await sellHandler(trade);
      // });
      await redisClient.lpush("future:sell-stream", JSON.stringify(trade));
     }
    }
   }
  } catch (error: any) {
   console.log(error.message);
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

const startBuyHandler = async () => {
 console.log("Buy Handler started..");
 while (true) {
  const stream = await buyHandlerClient.brpop("future:buy-stream", 0);
  if (!stream) continue;
  const str = stream[1];
  const parsedData = JSON.parse(str);
  await buyHandler(parsedData);
 }
};

const startSellHandler = async () => {
 console.log("Sell Handler started..");
 while (true) {
  const stream = await sellHandlerClient.brpop("future:sell-stream", 0);
  if (!stream) continue;
  const str = stream[1];
  const parsedData = JSON.parse(str);
  await sellHandler(parsedData);
 }
};

startBuyHandler();
startSellHandler();

export default futureTradeStream;
