import axios from "axios";
import TickerModel from "../models/ticker.models";
import TradeModel from "../models/trades.models";
import WebSocket from "ws";
import parseBinanaceSpotStream from "./parseBinanceSpotStream";
import exchange from "./exchange.conn";

const getTrades = async (symbol: string) => {
 const trades = await exchange.fetchMyTrades(symbol);
 return trades;
};

export const getOrders = async (symbol?: string, side?: string) => {
 if (symbol) {
  const orders = await exchange.fetchOpenOrders(symbol);
  if (side) {
  return orders
    .filter((order) => order.side === side)
    .map((order) => order.info);
  }
  return orders.map((order) => order.info);
 }

 const tickers = await TickerModel.find({});
 const symbols = tickers.map((ticker) => ticker.symbol);
 const orders = (
  await Promise.all(symbols.map((symbol) => exchange.fetchOpenOrders(symbol)))
 )
  .flat()
  .map((order) => order.info);

 if (side) {
  return orders.filter((order) => order.side === side);
 }

 return orders;
};

export const getOrdersBySymbol = async (symbol: string) => {
 const orders = await exchange.fetchOpenOrders(symbol);
 return orders;
};

export const cancelOrder = async (id: string, symbol: string) => {
 const order = await exchange.cancelOrder(id, symbol);
 return order;
};

const tradeSync = async () => {
 const tickers = await TickerModel.find({});
 const symbols = tickers.map((ticker) => ticker.symbol);
 for (let i = 0; i < symbols.length; i++) {
  const lastTrades = await TradeModel.find({ symbol: symbols[i] })
   .sort({ createdAt: -1 })
   .limit(1);
  const lastTrade =
   lastTrades.length === 0
    ? Date.now() - 1000 * 60 * 60 * 24
    : new Date(lastTrades[0].createdAt).getTime();

  const trades = (await getTrades(symbols[i]))
   .filter((trade) => new Date(trade.timestamp).getTime() > lastTrade)
   .filter((trade) => trade.side === "buy");
  for (let j = 0; j < trades.length; j++) {
   const trade = trades[j].info;
   const newTradeBody = {
    buyPrice: trade.price,
    quantity: trade.qty,
    symbol: trade.symbol,
    user: "63beffd81c1312d53375a43f",
   };
   await TradeModel.create(newTradeBody);
  }
 }
};

const autoTradeSync = async () => {
 let listenerKey = "";
 const getListenerkey = async () => {
  try {
   const { data } = await axios.post(
    "https://api.binance.com/api/v3/userDataStream",
    null,
    {
     headers: {
      "X-MBX-APIKEY": process.env.API_KEY,
     },
    }
   );
   listenerKey = data.listenKey;
  } catch (error: any) {
   console.log(error.message);
  }
 };

 await getListenerkey();

 const ws = new WebSocket("wss://stream.binance.com:9443/ws/" + listenerKey);

 ws.on("open", () => {
  console.log("Binace WebSocket Connected", new Date().toLocaleString());
 });

 ws.on("message", async (data) => {
  const parsedData = JSON.parse(data.toString());
  parseBinanaceSpotStream(parsedData);
 });

 const intervalId = setInterval(() => {
  ws.close();
 }, 1000 * 60 * 30);

 ws.on("close", () => {
  console.log("Binace WebSocket Disconnected", new Date().toLocaleString());
  clearInterval(intervalId);
  autoTradeSync();
 });
};

export default autoTradeSync;
