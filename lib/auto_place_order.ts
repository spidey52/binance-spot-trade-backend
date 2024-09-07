import FutureTickerModel from "../models/future/future.ticker.models";
import FutureTradeModel from "../models/future/future.trade.models";
import redisClient from "../redis/redis_conn";
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

 const currentPrice = redisClient.hget("satyam-coins", ticker);
 if (!currentPrice) return;

 buyPrice = Math.min(buyPrice, +currentPrice);

 await futureExchange.createLimitBuyOrder(tickerDetails.symbol, tickerDetails.amount, buyPrice);
};

export default handleAutoPlaceOrder;
