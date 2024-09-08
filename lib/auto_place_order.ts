import FutureTickerModel from "../models/future/future.ticker.models";
import FutureTradeModel from "../models/future/future.trade.models";
import redisClient from "../redis/redis_conn";
import notificationEvent from "./event/notification.event";
import { futureExchange } from "./utils/order.future";

const handleAutoPlaceOrder = async (ticker: string) => {
 // cancel all order and place new order
 try {
  const tickerDetails = await FutureTickerModel.findOne({ symbol: ticker });
  if (!tickerDetails) return;

  try {
   const pendingOrders = await futureExchange.fetchOpenOrders(ticker);
   const buyOrders: string[] = pendingOrders.filter((order) => order.side === "buy").map((order) => order.id);
   if (buyOrders.length) {
    const result = await Promise.allSettled(buyOrders.map((orderId) => futureExchange.cancelOrder(orderId, ticker)));

    const rejected = result.filter((r) => r.status === "rejected");
    const fulfilled = result.filter((r) => r.status === "fulfilled");
    if (rejected.length) {
     notificationEvent.emit("notification", {
      title: `Failed to cancel open orders for ${ticker}.. Auto Place Order`,
      body: JSON.stringify(rejected),
     });
    }

    if (fulfilled.length) {
     notificationEvent.emit("notification", {
      title: `Canceled ${fulfilled.length} open orders for ${ticker}.. Auto Place Order`,
      body: JSON.stringify(fulfilled),
     });
    }
   }
  } catch (error: any) {
   notificationEvent.emit("notification", {
    title: `Failed to fetch open orders for ${ticker}.. Auto Place Order`,
    body: error.message + " | " + JSON.stringify(error),
   });
  }

  if (tickerDetails.rob === false) return;

  const lastPendingTrade = await FutureTradeModel.findOne({ symbol: ticker, sellPrice: { $exists: false } }).sort({
   buyTime: -1,
  });

  let buyPrice = 1000 * 1000 * 10;
  if (lastPendingTrade) {
   buyPrice = lastPendingTrade.buyPrice * ((100 - tickerDetails.buyPercent) / 100);
  }

  const currentPrice: string | null = await redisClient.hget("satyam-coins", ticker);
  if (!currentPrice) return;

  buyPrice = Math.min(buyPrice, +currentPrice);

  // console.log("Auto Place Order", ticker, buyPrice);
  await futureExchange.createLimitBuyOrder(tickerDetails.symbol, tickerDetails.amount, buyPrice);
 } catch (error: any) {
  notificationEvent.emit("notification", {
   title: `Failed to create limit buy order for ${ticker}.. Auto Place Order`,
   body: error.message,
  });
 }
};
// handleAutoPlaceOrder("SOLUSDT");

export default handleAutoPlaceOrder;
