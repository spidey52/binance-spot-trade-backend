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

export const getBuyOrderPercent = async (symbol: string, sell?: boolean) => {
 const ticker = await TickerModel.findOne({ symbol });
 if (!ticker) return 2;
 if (sell === true) {
  if (ticker.sellPercent) return ticker.sellPercent;
  return 2;
 }
 if (ticker.buyPercent) return ticker.buyPercent;
 return 2;
};

export const getSellOrderPercent = async (symbol: string) => {
 return getBuyOrderPercent(symbol, true);
};
