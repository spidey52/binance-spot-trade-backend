import moment from "moment";
import notificationEvent from "../lib/event/notification.event";
import { futureExchange } from "../lib/utils/order.future";
import FutureTickerModel from "../models/future/future.ticker.models";

export const kPendingTradesFilter = { sellTime: { $exists: false } };
export const kCalculateInvestment = { $multiply: ["$buyPrice", "$quantity"] };

const findOrdersAndCancel = async (symbol: string) => {
 try {
  const ticker = await FutureTickerModel.findOne({ symbol });

  if (!ticker) return notificationEvent.emit("notification", { title: `Ticker not found for ${symbol}`, body: `Symbol: ${symbol} | Time: ${moment().format("HH:mm:ss")}` });
  const maxOrder = ticker.maxPendingOrders;

  const orders = await futureExchange.fetchOpenOrders(symbol);
  const buyOrders = orders.filter((order) => order.side === "buy");
  //  sort buy orders by price

  buyOrders.sort((a, b) => b.price - a.price);

  const cancelOrders = buyOrders.slice(maxOrder);
  let cancelOrderIds: string[] = [];

  for (let i = 0; i < cancelOrders.length; i++) {
   await futureExchange.cancelOrder(cancelOrders[i].id, symbol);
   cancelOrderIds.push(cancelOrders[i].id);
  }

  if (cancelOrderIds.length === 0) return;

  notificationEvent.emit("notification", {
   title: `Canceled ${cancelOrders.length} orders for ${symbol}`,
   body: `Symbol: ${symbol} | Orders: ${cancelOrderIds.join(", ")} | Time: ${moment().format("HH:mm:ss")}`,
  });
 } catch (error) {
  notificationEvent.emit("notification", {
   title: `Error canceling orders for ${symbol}`,
   body: `Symbol: ${symbol} | Time: ${moment().format("HH:mm:ss")}`,
  });
 }
};

const TradeUtils = { findOrdersAndCancel };

export default TradeUtils;
