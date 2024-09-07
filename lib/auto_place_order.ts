import FutureTickerModel from "../models/future/future.ticker.models";
import FutureTradeModel from "../models/future/future.trade.models";
import redisClient from "../redis/redis_conn";
import notificationEvent from "./event/notification.event";
import { futureExchange } from "./utils/order.future";

const handleAutoPlaceOrder = async (ticker: string) => {
 // cancel all order and place new order
 const tickerDetails = await FutureTickerModel.findOne({ symbol: ticker });
 if (!tickerDetails) return;

 const pendingOrders = await futureExchange.fetchOpenOrders(ticker);
 const buyOrders = pendingOrders.filter((order) => order.side === "buy").map((order) => order.id);

 if (buyOrders.length) {
  await Promise.allSettled(buyOrders.map((orderId) => futureExchange.cancelOrder(orderId, ticker)));
 }

 if (tickerDetails.rob === false) return;

 const lastPendingTrade = await FutureTradeModel.findOne({ symbol: ticker, sellPrice: { $exists: false } }).sort({
  buyTime: -1,
 });

 let buyPrice = Infinity;
 if (lastPendingTrade) {
  buyPrice = lastPendingTrade.buyPrice * ((100 - tickerDetails.buyPercent) / 100);
 }

 const currentPrice: string | null = await redisClient.hget("satyam-coins", ticker);
 if (!currentPrice) return;

 buyPrice = Math.min(buyPrice, +currentPrice);

 try {
  await futureExchange.createLimitBuyOrder(tickerDetails.symbol, tickerDetails.amount, buyPrice);
 } catch (error: any) {
  notificationEvent.emit("notification", {
   title: `Failed to create limit buy order for ${ticker}.. Auto Place Order`,
   body: error.message,
  });
 }
};

export default handleAutoPlaceOrder;
