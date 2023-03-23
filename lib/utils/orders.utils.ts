import { getBuyPrice, getPrecision } from "./getPercent";
import TickerModel from "../../models/ticker.models";
import TradeModel from "../../models/trades.models";
import exchange from "../exchange.conn";
import OrdersModel from "../../models/orders.models";

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

const pendingOrders = async () => {
 const orders = await OrdersModel.find({ status: "NEW" });

 for (const order of orders) {
  // compare order status with exchange status

  const orderId = order.orderId;

  const exchangeOrder = await exchange.fetchOrder(orderId + "", order.symbol);
  order.status = exchangeOrder.status;
  await order.save();
 }
};

setInterval(() => {
 pendingOrders();
}, 1000 * 60 * 3);
