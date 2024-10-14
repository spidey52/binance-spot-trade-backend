import FutureTickerModel from "../models/future/future.ticker.models";
import FutureTradeModel from "../models/future/future.trade.models";
import redisClient from "../redis/redis_conn";
import notificationEvent from "./event/notification.event";
import { futureExchange } from "./utils/order.future";

const handleAutoPlaceOrder = async (
 ticker: string,
 config: {
  side: "buy" | "sell";
 }
) => {
 // cancel all order and place new order

 try {
  const tickerDetails = await FutureTickerModel.findOne({ symbol: ticker });
  if (!tickerDetails)
   return {
    title: `Ticker not found for ${ticker}.. Auto Place Order`,
    body: `Symbol: ${ticker}`,
   };

  // check if max  pending orders crosses the limit
  const pendingOrders = await redisClient.hget("pending-orders", ticker);

  if (pendingOrders && +pendingOrders >= tickerDetails.maxPendingOrders) {
   notificationEvent.emit("notification", {
    title: `Max Pending Orders Limit Reached for ${ticker}.. Auto Place Order`,
    body: `Symbol: ${ticker} | Pending Orders: ${pendingOrders}`,
   });

   return;
  }

  if (config.side === "buy" && tickerDetails.rob === false) {
   notificationEvent.emit("notification", {
    title: `ROB is disabled for ${ticker}.. Auto Place Order`,
    body: `Symbol ${ticker}`,
   });

   return;
  }

  if (config.side === "sell" && tickerDetails.ros === false) {
   notificationEvent.emit("notification", {
    title: `ROS is disabled for ${ticker}.. Auto Place Order`,
    body: `Symbol ${ticker}`,
   });

   return;
  }

  try {
   const pendingOrders = await futureExchange.fetchOpenOrders(ticker);
   const buyOrders: string[] = pendingOrders.filter((order) => order.side === "buy").map((order) => order.id);

   if (buyOrders.length) {
    const result = await Promise.allSettled(buyOrders.map((orderId) => futureExchange.cancelOrder(orderId, ticker)));

    const rejected = result.filter((r) => r.status === "rejected");
    if (rejected.length) {
     notificationEvent.emit("notification", {
      title: `Failed to cancel open orders for ${ticker}.. Auto Place Order`,
      body: JSON.stringify(rejected),
     });
    }
   }
  } catch (error: any) {
   notificationEvent.emit("notification", {
    title: `Failed to fetch open orders for ${ticker}.. Auto Place Order`,
    body: error.message + " | " + JSON.stringify(error),
   });
  }

  if (tickerDetails.rob === false) {
   notificationEvent.emit("notification", {
    title: `ROB is disabled for ${ticker}.. Auto Place Order`,
    body: `Symbol: ${ticker}`,
   });
   return;
  }

  const lastPendingTrade = await FutureTradeModel.findOne({ symbol: ticker, sellPrice: { $exists: false } }).sort({
   buyTime: -1,
  });

  let buyPrice = 1000 * 1000 * 10;
  if (lastPendingTrade) {
   buyPrice = lastPendingTrade.buyPrice * ((100 - tickerDetails.buyPercent) / 100);
  }

  const currentPrice: string | null = await redisClient.hget("satyam-coins", ticker);

  if (!currentPrice) {
   notificationEvent.emit("notification", {
    title: `Price not found for ${ticker}.. Auto Place Order`,
    body: `Symbol: ${ticker}`,
   });

   return;
  }

  buyPrice = +Math.min(buyPrice, +currentPrice).toFixed(tickerDetails.precision);

  // console.log("Auto Place Order", ticker, buyPrice);
  await futureExchange.createLimitBuyOrder(tickerDetails.symbol, tickerDetails.amount, buyPrice);

  // notificationEvent.emit("notification", {
  //  title: `Auto Place Order for ${ticker}..`,
  //  body: `Symbol: ${ticker} | Price: ${buyPrice} | Quantity: ${tickerDetails.amount}`,
  // });
 } catch (error: any) {
  notificationEvent.emit("notification", {
   title: `Failed to create limit buy order for ${ticker}.. Auto Place Order`,
   body: error.message,
  });
 }
};
// handleAutoPlaceOrder("SOLUSDT");

export default handleAutoPlaceOrder;
