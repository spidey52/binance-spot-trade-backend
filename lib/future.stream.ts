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
   //  const { i: orderId, s: symbol, p: price, q: quantity, S: side, X: executionType, rp } = parsedData;
   const { e: event, o: order } = parsedData;
   if (event !== "ORDER_TRADE_UPDATE") return;

   const { i: orderId, s: symbol, p: price, q: quantity, S: side, X: executionType, rp } = order;
   const realizedProfit = Number(rp);
   await sendFutureTradeNotification({ symbol, price, quantity, side, realizedProfit, executionType });
   if (realizedProfit === 0) return;
   if (executionType !== "TRADE") return;

   await FutureTradeModel.create({
    price,
    symbol,
    realizedProfit: rp,
    date: new Date(),
    orderId,
    user: "63beffd81c1312d53375a43f",
   });
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

/*

ade  | Binace WebSocket Connected 2/21/2023, 12:02:00 AM
7|binance-spot-trade  | {
7|binance-spot-trade  |   e: 'ORDER_TRADE_UPDATE',
7|binance-spot-trade  |   T: 1676917968793,
7|binance-spot-trade  |   E: 1676917968805,
7|binance-spot-trade  |   o: {
7|binance-spot-trade  |     s: 'BNBUSDT',
7|binance-spot-trade  |     c: 'android_x4yKuvktrQVC39XWWaNS',
7|binance-spot-trade  |     S: 'BUY',
7|binance-spot-trade  |     o: 'LIMIT',
7|binance-spot-trade  |     f: 'GTC',
7|binance-spot-trade  |     q: '0.08',
7|binance-spot-trade  |     p: '313.380',
7|binance-spot-trade  |     ap: '0',
7|binance-spot-trade  |     sp: '0',
7|binance-spot-trade  |     x: 'NEW',
7|binance-spot-trade  |     X: 'NEW',
7|binance-spot-trade  |     i: 44908012756,
7|binance-spot-trade  |     l: '0',
7|binance-spot-trade  |     z: '0',
7|binance-spot-trade  |     L: '0',
7|binance-spot-trade  |     T: 1676917968793,
7|binance-spot-trade  |     t: 0,
7|binance-spot-trade  |     b: '25.07040',
7|binance-spot-trade  |     a: '0',
7|binance-spot-trade  |     m: false,
7|binance-spot-trade  |     R: false,
7|binance-spot-trade  |     wt: 'CONTRACT_PRICE',
7|binance-spot-trade  |     ot: 'LIMIT',
7|binance-spot-trade  |     ps: 'BOTH',
7|binance-spot-trade  |     cp: false,
7|binance-spot-trade  |     rp: '0',
7|binance-spot-trade  |     pP: false,
7|binance-spot-trade  |     si: 0,
7|binance-spot-trade  |     ss: 0
7|binance-spot-trade  |   }
7|binance-spot-trade  | }
7|binance-spot-trade  | {
7|binance-spot-trade  |   e: 'ACCOUNT_UPDATE',
7|binance-spot-trade  |   T: 1676918019899,
7|binance-spot-trade  |   E: 1676918019903,
7|binance-spot-trade  |   a: { B: [ [Object] ], P: [ [Object] ], m: 'ORDER' }
7|binance-spot-trade  | }
7|binance-spot-trade  | {
7|binance-spot-trade  |   e: 'ORDER_TRADE_UPDATE',
7|binance-spot-trade  |   T: 1676918019899,
7|binance-spot-trade  |   E: 1676918019903,
7|binance-spot-trade  |   o: {
7|binance-spot-trade  |     s: 'BNBUSDT',
7|binance-spot-trade  |     c: 'android_x4yKuvktrQVC39XWWaNS',
7|binance-spot-trade  |     S: 'BUY',
7|binance-spot-trade  |     o: 'LIMIT',
7|binance-spot-trade  |     f: 'GTC',
7|binance-spot-trade  |     q: '0.08',
7|binance-spot-trade  |     p: '313.380',
7|binance-spot-trade  |     ap: '313.38000',
7|binance-spot-trade  |     sp: '0',
7|binance-spot-trade  |     x: 'TRADE',
7|binance-spot-trade  |     X: 'PARTIALLY_FILLED',
7|binance-spot-trade  |     i: 44908012756,
7|binance-spot-trade  |     l: '0.03',
7|binance-spot-trade  |     z: '0.03',
7|binance-spot-trade  |     L: '313.380',
7|binance-spot-trade  |     n: '0.00000539',
7|binance-spot-trade  |     N: 'BNB',
7|binance-spot-trade  |     T: 1676918019899,
7|binance-spot-trade  |     t: 928265634,
7|binance-spot-trade  |     b: '15.66899',
7|binance-spot-trade  |     a: '0',
7|binance-spot-trade  |     m: true,
7|binance-spot-trade  |     R: false,
7|binance-spot-trade  |     wt: 'CONTRACT_PRICE',
7|binance-spot-trade  |     ot: 'LIMIT',
7|binance-spot-trade  |     ps: 'BOTH',
7|binance-spot-trade  |     cp: false,
7|binance-spot-trade  |     rp: '0',
7|binance-spot-trade  |     pP: false,
7|binance-spot-trade  |     si: 0,
7|binance-spot-trade  |     ss: 0
7|binance-spot-trade  |   }
7|binance-spot-trade  | }
7|binance-spot-trade  | {
7|binance-spot-trade  |   e: 'ACCOUNT_UPDATE',
7|binance-spot-trade  |   T: 1676918027472,
7|binance-spot-trade  |   E: 1676918027509,
7|binance-spot-trade  |   a: { B: [ [Object] ], P: [ [Object] ], m: 'ORDER' }
7|binance-spot-trade  | }
7|binance-spot-trade  | {
7|binance-spot-trade  |   e: 'ORDER_TRADE_UPDATE',
7|binance-spot-trade  |   T: 1676918027472,
7|binance-spot-trade  |   E: 1676918027509,
7|binance-spot-trade  |   o: {
7|binance-spot-trade  |     s: 'BNBUSDT',
7|binance-spot-trade  |     c: 'android_x4yKuvktrQVC39XWWaNS',
7|binance-spot-trade  |     S: 'BUY',
7|binance-spot-trade  |     o: 'LIMIT',
7|binance-spot-trade  |     f: 'GTC',
7|binance-spot-trade  |     q: '0.08',
7|binance-spot-trade  |     p: '313.380',
7|binance-spot-trade  |     ap: '313.38000',
7|binance-spot-trade  |     sp: '0',
7|binance-spot-trade  |     x: 'TRADE',
7|binance-spot-trade  |     X: 'FILLED',
7|binance-spot-trade  |     i: 44908012756,
7|binance-spot-trade  |     l: '0.05',
7|binance-spot-trade  |     z: '0.08',
7|binance-spot-trade  |     L: '313.380',
7|binance-spot-trade  |     n: '0.00313380',
7|binance-spot-trade  |     N: 'USDT',
7|binance-spot-trade  |     T: 1676918027472,
7|binance-spot-trade  |     t: 928265635,
7|binance-spot-trade  |     b: '0',
7|binance-spot-trade  |     a: '0',
7|binance-spot-trade  |     m: true,
7|binance-spot-trade  |     R: false,
7|binance-spot-trade  |     wt: 'CONTRACT_PRICE',
7|binance-spot-trade  |     ot: 'LIMIT',
7|binance-spot-trade  |     ps: 'BOTH',
7|binance-spot-trade  |     cp: false,
7|binance-spot-trade  |     rp: '0',
7|binance-spot-trade  |     pP: false,
7|binance-spot-trade  |     si: 0,
7|binance-spot-trade  |     ss: 0
7|binance-spot-trade  |   }
7|binance-spot-trade  | }



*/
