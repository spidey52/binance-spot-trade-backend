import myenv from "../config/myenv.config";
import FutureTickerModel, { OrderStrategy } from "../models/future/future.ticker.models";
import FutureTradeModel from "../models/future/future.trade.models";
import handleAutoPlaceOrder from "./auto_place_order";
import notificationEvent from "./event/notification.event";
import { futureExchange } from "./utils/order.future";

const buyHandler = async (trade: any) => {
 try {
  console.log("Buy Handler", trade.s);
  const ticker = await FutureTickerModel.findOne({ symbol: trade.s });
  if (!ticker) return console.log("Ticker not found");

  const { i: orderId, s: symbol, q: quantity, p: buyPrice } = trade;

  await FutureTradeModel.create({
   orderId,
   symbol,
   quantity,
   buyPrice,
   buyTime: new Date(),
  });

  const sellPrice = buyPrice * ((100 + ticker.sellPercent) / 100);
  await futureExchange.createLimitSellOrder(symbol, quantity, sellPrice);

  if (ticker.strategy === OrderStrategy.AUTO_ORDER) {
   await handleAutoPlaceOrder(symbol, { side: "buy" });

   notificationEvent.emit("notification", {
    title: `New Buy Order Filled for ${symbol} | Auto Order`,
    body: `Symbol: ${symbol} | Price: ${buyPrice} | Quantity: ${quantity} | Side: BUY | Realized Profit: 0.0`,
   });

   return;
  } else {
   let body = `Symbol: ${symbol} | Price: ${buyPrice} | Quantity: ${quantity} | Side: BUY | Realized Profit: 0.0\n`;

   body += JSON.stringify(trade, null, 2);

   notificationEvent.emit("notification", {
    title: `strategy is not AUTO_ORDER for ${symbol} | ${myenv.SERVER_NAME}`,

    body,
   });
  }

  notificationEvent.emit("notification", {
   title: `New Buy Order Filled for ${symbol} | ${myenv.SERVER_NAME}`,
   body: `Symbol: ${symbol} | Price: ${buyPrice} | Quantity: ${quantity} | Side: BUY | Realized Profit: 0.0`,
  });
 } catch (error: any) {
  notificationEvent.emit("notification", {
   title: `Failed to create limit sell order for ${trade.s}`,
   body: error.message,
  });

  return;
 }
};

export default buyHandler;
