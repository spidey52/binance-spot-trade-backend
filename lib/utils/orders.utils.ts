import TickerModel from "../../models/ticker.models";
import TradeModel from "../../models/trades.models";
import exchange from "../exchange.conn";

export const findPendingOrderByPrice = async (
 symbol: string,
 price: number
) => {
 const order = await TradeModel.findOne({
  symbol,
  buyPrice: price,
  sellPrice: { $exists: false },
 });

 const orderOnExchange = await exchange.fetchOpenOrders(symbol);
 if (orderOnExchange.length > 0) {
  const order = orderOnExchange.find((o) => o.price === price);
  console.log("order", order);
  return order;
 }

 return order;
};

export const createBuyOrder = async (
 symbol: string,
 quantity: number,
 price: number
) => {
 const isExists = await findPendingOrderByPrice(symbol, price);
 if (isExists) {
  console.log("Order already exists", symbol, price);
  return;
 }

 const order = await exchange.createLimitBuyOrder(symbol, quantity, price);
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
  });
  return {
   buyPercent: 2,
   sellPercent: 2,
   loopEnabled: false,
  };
 }
 const { buyPercent = 2, sellPercent = 2, loopEnabled = false } = ticker;
 return { buyPercent, sellPercent, loopEnabled };
};
