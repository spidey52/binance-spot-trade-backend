import { addOpenOrder, deleteOpenOrder, findPendingOrder, futureExchange } from "./utils/order.future";
import { subscriberClient } from "./../redis/redis_conn";
import { handleCustomNotification } from "./utils/notificationHandler";
import axios from "axios";
import WebSocket from "ws";
import FutureTradeModel from "../models/future/future.trade.models";
import FutureTickerModel from "../models/future/future.ticker.models";
import AsyncQueue from "./utils/myqueue";
import notificationEvent from "./event/notification.event";

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
  const parsedData = JSON.parse(data.toString());

  // console.log(parsedData);

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
     if (trade.S === "BUY") {
      // await buyHandler(trade);
      // const buyQueue = myQueue.get(trade.s) || new AsyncQueue();
      let buyQueue = myQueue.get(trade.s);
      if (!buyQueue) {
       buyQueue = new AsyncQueue();
       myQueue.set(trade.s, buyQueue);
      }

      await buyQueue.enqueue(async () => {
       await buyHandler(trade);
      });
     } else if (trade.S === "SELL") {
      // await sellHandler(trade);
      let sellQueue = myQueue.get(trade.s);
      if (!sellQueue) {
       sellQueue = new AsyncQueue();
       myQueue.set(trade.s, sellQueue);
      }

      await sellQueue.enqueue(async () => {
       await sellHandler(trade);
      });
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

const buyHandler = async (trade: any) => {
 try {
  console.log("Buy Handler", trade.s);
  const ticker = await FutureTickerModel.findOne({ symbol: trade.s });
  if (!ticker) return console.log("Ticker not found");

  const { i: orderId, s: symbol, q: quantity, p: buyPrice } = trade;

  await FutureTradeModel.create({
   orderId,
   symbol,
   quantity,
   buyPrice,
   buyTime: new Date(),
  });

  const sellPrice = buyPrice * ((100 + ticker.sellPercent) / 100);
  await futureExchange.createLimitSellOrder(symbol, quantity, sellPrice);

  //  TODO: no need to create limit buy order
  // if (ticker.rob) {
  //  const robPrice = buyPrice * ((100 - ticker.buyPercent) / 100);
  //  const isExists = findPendingOrder(symbol, robPrice);
  //  if (!isExists) {
  //   await futureExchange.createLimitBuyOrder(symbol, quantity, robPrice);
  //  }
  // }

  // sendFutureTradeNotification({
  //  symbol,
  //  price: buyPrice,
  //  quantity,
  //  side: "BUY",
  //  realizedProfit: 0,
  //  executionType: "Filled",
  // });

  notificationEvent.emit("notification", {
   title: `New Buy Order Filled for ${symbol}`,
   body: `Symbol: ${symbol} | Price: ${buyPrice} | Quantity: ${quantity} | Side: BUY | Realized Profit: 0.0`,
  });
 } catch (error: any) {
  console.log(error.message);
  console.log("Failed to create limit sell order");
  handleCustomNotification({
   title: "Failed to create limit sell order for " + trade.s,
   body: error.message,
  });
  return;
 }
};

const sellHandler = async (trade: any) => {
 const { i: orderId, s: symbol, q: quantity, p: sellPrice } = trade;
 try {
  console.log("Sell Handler", trade);

  const isAlreadyExecuted = await FutureTradeModel.findOne({ orderId, sellPrice: { $exists: true } });
  if (isAlreadyExecuted) return;

  const minValueTrade = await FutureTradeModel.findOne({
   quantity: quantity,
   symbol,
   sellPrice: { $exists: false },
  }).sort({ buyPrice: 1 });

  if (!minValueTrade || !minValueTrade.buyPrice || !minValueTrade.quantity) return;

  await FutureTradeModel.findOneAndUpdate(minValueTrade._id, {
   sellPrice: sellPrice,
   sellTime: new Date(),
   orderId,
  });

  await futureExchange.createLimitBuyOrder(symbol, quantity, minValueTrade.buyPrice);
  const futureTicker = await FutureTickerModel.findOne({ symbol }).lean();

  // TODO: not know what is this for
  const nextPrice = minValueTrade.buyPrice * ((100 + (futureTicker?.buyPercent || 2) * 2) / 100);

  const isSellPositionExists = await FutureTradeModel.findOne({ symbol, sellPrice: { $exists: false }, buyPrice: { $lte: nextPrice } });

  if (!isSellPositionExists) {
   if (futureTicker && futureTicker.oomp && futureTicker.amount) {
    await futureExchange.createLimitBuyOrder(symbol, futureTicker.amount, sellPrice);
   }
  }

  const profit = (sellPrice - minValueTrade.buyPrice) * minValueTrade.quantity;

  notificationEvent.emit("notification", {
   title: `New Sell Order Filled for ${symbol}`,
   body: `Symbol: ${symbol} | Price: ${sellPrice} | Quantity: ${quantity} | Side: SELL | Realized Profit: ${profit.toFixed(2)}`,
  });
 } catch (error: any) {
  console.log(error.message);
  console.log("Failed to create limit buy order");

  handleCustomNotification({
   title: "Failed to create limit buy order for " + trade.s,
   body: error.message,
  });

  return;
 }
};

export default futureTradeStream;
