import { Response } from "express";
import ccxt from "ccxt";
import { handleCustomNotification } from "./utils/notificationHandler";
import axios from "axios";
import WebSocket from "ws";
import FutureTradeModel from "../models/future.trade.models";
import FutureTickerModel from "../models/future.ticker.models";
import TickerModel from "../models/ticker.models";

const futureExchange = new ccxt.binance({
 apiKey: process.env.NEW_API_KEY,
 secret: process.env.NEW_API_SECRET,
 options: {
  defaultType: "future",
 },
});

console.log("Future Stream Started", process.env.NEW_API_KEY);
console.log("Future Stream Started", process.env.NEW_API_SECRET);

type order = {
 symbol: string;
 orderId: string;
 price: number;
 side: string;
};
export const OPEN_ORDERS: {
 [key: string]: order[];
} = {};

const futureTradeStream = async () => {
 let listenerKey = "";
 const getListenerkey = async () => {
  try {
   const { data } = await axios.post("https://fapi.binance.com/fapi/v1/listenKey", null, {
    headers: {
     "X-MBX-APIKEY": process.env.NEW_API_KEY,
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

    if (trade.x === "NEW") {
     addOpenOrder(trade.s, trade.i + "", trade.p, trade.S.toLowerCase());
    } else if (trade.x === "CANCELED") {
     deleteOpenOrder(trade.s, trade.i + "");
    } else if (trade.x === "REJECTED") {
     deleteOpenOrder(trade.s, trade.i + "");
    } else if (trade.x === "TRADE") {
     deleteOpenOrder(trade.s, trade.i + "");
    }

    if (trade.x === "TRADE" && trade.X === "FILLED") {
     if (trade.S === "BUY") {
      buyHandler(trade);
     } else if (trade.S === "SELL") {
      sellHandler(trade);
     }
    }
   }
  } catch (error: any) {}
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

const addOpenOrder = (symbol: string, orderId: string, price: number, side: string) => {
 let obj = {
  symbol,
  orderId,
  price,
  side,
 };
 if (OPEN_ORDERS[symbol]) OPEN_ORDERS[symbol].push(obj);
 else OPEN_ORDERS[symbol] = [obj];
};
const deleteOpenOrder = (symbol: string, orderId: string) => {
 if (OPEN_ORDERS[symbol]) {
  OPEN_ORDERS[symbol] = OPEN_ORDERS[symbol].filter((order) => order.orderId !== orderId);
 }
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

  if (ticker.rob) {
   const robPrice = buyPrice * ((100 - ticker.buyPercent) / 100);
   await futureExchange.createLimitBuyOrder(symbol, quantity, robPrice);
  }
 } catch (error: any) {
  console.log(error.message);
  console.log("Failed to create limit sell order");
  return;
 }
};

const sellHandler = async (trade: any) => {
 try {
  console.log("Sell Handler", trade);
  const { i: orderId, s: symbol, q: quantity, p: sellPrice } = trade;
  const minValueTrade = await FutureTradeModel.findOne({
   symbol,
   sellPrice: { $exists: false },
  }).sort({ buyPrice: 1 });

  if (!minValueTrade) return console.log("Trade not found");

  await FutureTradeModel.findOneAndUpdate(minValueTrade._id, {
   sellPrice: sellPrice,
   sellTime: new Date(),
  });

  if (minValueTrade.buyPrice) {
   await futureExchange.createLimitBuyOrder(symbol, quantity, minValueTrade.buyPrice);
  }
 } catch (error: any) {
  console.log(error.message);
  console.log("Failed to create limit buy order");
  return;
 }
};

const sendFutureTradeNotification = async ({ symbol, price, quantity, side, realizedProfit, executionType }: any) => {
 try {
  await handleCustomNotification({
   title: "New Future Trade" + " " + executionType,
   body: `Symbol: ${symbol} | Price: ${price} | Quantity: ${quantity} | Side: ${side} | Realized Profit: ${realizedProfit}`,
  });
 } catch (error: any) {
  console.log(error.message);
  console.log("Failed to send notification");
  return;
 }
};

export default futureTradeStream;

(async () => {
 const btc = "BTCUSDT";
 const ticker = await FutureTickerModel.findOne({ symbol: btc });
 if (ticker) return console.log("Ticker already found");

 await FutureTickerModel.create({
  symbol: btc,
  buyPercent: 0.5,
  sellPercent: 0.3,
 });
})();

(async () => {
 const orders = await futureExchange.fetchOpenOrders("BTCBUSD");

 OPEN_ORDERS["BTCBUSD"] = orders.map((order: any) => {
  return {
   symbol: order.symbol,
   orderId: order.id,
   price: order.price,
   side: order.side,
  };
 });

})();
