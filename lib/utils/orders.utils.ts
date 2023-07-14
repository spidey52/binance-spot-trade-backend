import {  getPrecision } from "./getPercent";
import TickerModel from "../../models/ticker.models";
import TradeModel from "../../models/trades.models";
import exchange from "../exchange.conn";
import OrdersModel from "../../models/orders.models";
import FutureTickerModel from "../../models/future/future.ticker.models";
import { futureExchange } from "./order.future";

export const findPendingOrderByPrice = async (symbol: string, price: number) => {
 const { precision } = (await TickerModel.findOne({ symbol })) || { precision: 4 };
 const order = await TradeModel.findOne({
  symbol,
  buyPrice: Number(price.toFixed(precision)),
  sellPrice: { $exists: false },
 });

 if (order) return order;

 const orderExists = await OrdersModel.findOne({
  symbol,
  price: Number(price.toFixed(precision)),
  status: "NEW",
 });

 if (orderExists) return orderExists;

 //  const orderOnExchange = await exchange.fetchOpenOrders(symbol);

 //  if (orderOnExchange.length > 0) {
 //   console.log("orderOnExchange", price.toFixed(precision), precision);
 //   const order = orderOnExchange.find((o) => o.price.toFixed(precision) === price.toFixed(precision));
 //   console.log("order", order);
 //   return order;
 //  }

 return order;
};

export const createBuyOrder = async (symbol: string, quantity: number, price: number) => {
 const isExists = await findPendingOrderByPrice(symbol, price);
 if (isExists) {
  console.log("Order already exists", symbol, price);
  return;
 }

 const precision = await getPrecision(symbol);
 const order = await exchange.createLimitBuyOrder(symbol, quantity, Number(price.toFixed(precision)));
 return order;
};

export const getTickerDetails = async (symbol: string) => {
 const ticker = await TickerModel.findOne({ symbol });
 if (!ticker) {
  const newTicker = await TickerModel.create({
   symbol,
   buyPercent: 2,
   sellPercent: 2,
   loopEnabled: false,
   precision: 4,
  });
  return {
   buyPercent: 2,
   sellPercent: 2,
   loopEnabled: false,
   precision: 4,
  };
 }
 const { buyPercent = 2, sellPercent = 2, loopEnabled = false, precision } = ticker;
 return { buyPercent, sellPercent, loopEnabled, precision };
};

export const getBinanceOrders = async (search: string) => {
 try {
  console.time("getBinanceOrders");
  const coin = await FutureTickerModel.findOne({ symbol: { $regex: search, $options: "i" } });

  if (!coin) throw new Error("Coin not found");
  // const orders = await futureExchange.fetchOpenOrders(coin.symbol);
  // console.timeEnd("getBinanceOrders");
  // const buyOrders = orders.filter((order) => order.side.toLowerCase() === "buy");

  // console.log(buyOrders.length);

  //  await futureExchange.cancelOrders(buyOrders.map((order) => order.id), coin.symbol);
  //  console.log(futureExchange.hasCancelOrder);


 } catch (error: any) {
  throw new Error(error.message);
 }
};


getBinanceOrders("BTCUSDT");