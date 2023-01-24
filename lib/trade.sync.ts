import axios from "axios";
import ccxt from "ccxt";
import TickerModel from "../models/ticker.models";
import TradeModel from "../models/trades.models";
import WebSocket from "ws";
import parseBinanaceSpotStream from "./parseBinanceSpotStream";

const exchange = new ccxt.binance({
 apiKey: process.env.API_KEY,
 secret: process.env.API_SECRET,
});

const getTrades = async (symbol: string) => {
 const trades = await exchange.fetchMyTrades(symbol);
 return trades;
};

export const getOrders = async () => {
 const tickers = await TickerModel.find({});
 const symbols = tickers.map((ticker) => ticker.symbol);
 const orders = Promise.all(
  symbols.map((symbol) => exchange.fetchOpenOrders(symbol))
 );
 return orders;
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
  console.log("Binace WebSocket Connected");
 });

 ws.on("message", async (data) => {
  const parsedData = JSON.parse(data.toString());
  parseBinanaceSpotStream(parsedData);
 });

  const intervalId = setInterval(() => {
   getListenerkey();
 }, 1000 * 60 * 30);

 ws.on("close", () => {
  console.log("Binace WebSocket Disconnected");
  clearInterval(intervalId);
  autoTradeSync();
 });
};

export default autoTradeSync;
