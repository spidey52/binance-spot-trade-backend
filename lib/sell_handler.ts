import FutureTickerModel, { OrderStrategy } from "../models/future/future.ticker.models";
import FutureTradeModel from "../models/future/future.trade.models";
import handleAutoPlaceOrder from "./auto_place_order";
import notificationEvent from "./event/notification.event";
import OrderEvent from "./event/order.event";
import { handleCustomNotification } from "./utils/notificationHandler";
import { futureExchange } from "./utils/order.future";

const sellHandler = async (trade: any) => {
 const { i: orderId, s: symbol, q: quantity, p: sellPrice } = trade;
 try {
  console.log("Sell Handler", trade);

  const isAlreadyExecuted = await FutureTradeModel.findOne({ orderId, sellPrice: { $exists: true } });
  if (isAlreadyExecuted) return;

  const minValueTrade = await FutureTradeModel.findOne({
   quantity: quantity,
   symbol,
   sellPrice: { $exists: false },
  }).sort({ buyPrice: 1 });

  if (!minValueTrade || !minValueTrade.buyPrice || !minValueTrade.quantity) {
   notificationEvent.emit("notification", {
    title: `No Buy Order Found for ${symbol}`,
    body: `Symbol: ${symbol} | Quantity: ${quantity} | Side: SELL | Price: ${sellPrice}`,
   });
   return;
  }

  await FutureTradeModel.findOneAndUpdate(minValueTrade._id, {
   sellPrice: sellPrice,
   sellTime: new Date(),
   orderId,
  });

  const futureTicker = await FutureTickerModel.findOne({ symbol }).lean();

  if (futureTicker && futureTicker.strategy === OrderStrategy.AUTO_ORDER) {
   await handleAutoPlaceOrder(symbol, {
    side: "sell",
   });

   const profit = (sellPrice - minValueTrade.buyPrice) * minValueTrade.quantity;

   notificationEvent.emit("notification", {
    title: `New Sell Order Filled for ${symbol} | Auto Order`,
    body: `Symbol: ${symbol} | Price: ${sellPrice} | Quantity: ${quantity} | Side: SELL | Realized Profit: ${profit.toFixed(2)}`,
   });

   return;
  }

  await futureExchange.createLimitBuyOrder(symbol, quantity, minValueTrade.buyPrice);

  // TODO: not know what is this for
  const nextPrice = minValueTrade.buyPrice * ((100 + (futureTicker?.buyPercent || 2) * 2) / 100);

  const isSellPositionExists = await FutureTradeModel.findOne({ symbol, sellPrice: { $exists: false }, buyPrice: { $lte: nextPrice } });

  if (!isSellPositionExists) {
   if (futureTicker && futureTicker.oomp && futureTicker.amount) {
    await futureExchange.createLimitBuyOrder(symbol, futureTicker.amount, sellPrice);
   }
  }

  const profit = (sellPrice - minValueTrade.buyPrice) * minValueTrade.quantity;

  notificationEvent.emit("notification", {
   title: `New Sell Order Filled for ${symbol}`,
   body: `Symbol: ${symbol} | Price: ${sellPrice} | Quantity: ${quantity} | Side: SELL | Realized Profit: ${profit.toFixed(2)}`,
  });

  OrderEvent.evt.emit(OrderEvent.EventType.CANCEL_OPEN_ORDERS, symbol);
 } catch (error: any) {
  console.log(error.message);
  console.log("Failed to create limit buy order");

  handleCustomNotification({
   title: "Failed to create limit buy order for " + trade.s,
   body: error.message,
  });

  return;
 }
};

export default sellHandler;
