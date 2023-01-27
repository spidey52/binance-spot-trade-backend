import TradeModel from "../models/trades.models";
import exchange from "./exchange.conn";

const findMinValueTrade = async (symbol: string, quantity: number) => {
 const trade = await TradeModel.findOne({
  symbol,
  quantity,
  sellPrice: { $exists: false },
 }).sort({ buyPrice: 1 });
 return trade;
};

const parseBinanaceSpotStream = async (data: any) => {
 console.log(
  "Binance Spot Stream Data",
  console.log(new Date().toLocaleString())
 );

 const {
  e: eventType,
  S: side,
  s: symbol,
  p: price,
  q: quantity,
  x: executionType,
 } = data;

 if (eventType === "executionReport") {
  if (executionType === "TRADE") {
   if (side === "BUY") {
    // create new trade
    await TradeModel.create({
     buyPrice: price,
     quantity,
     symbol,
     user: "63beffd81c1312d53375a43f",
    });
    // await exchange.createLimitSellOrder(symbol, quantity, pr);
   }
   if (side === "SELL") {
    // update trade
    const trade = await findMinValueTrade(symbol, quantity);
    if (!trade) return;
    const updatedTrade = await TradeModel.findByIdAndUpdate(trade._id, {
     sellPrice: price,
    });

    // create new order
    if (!updatedTrade) return;
    exchange.createLimitBuyOrder(symbol, quantity, updatedTrade?.buyPrice);
   }
  }
 }
};

export default parseBinanaceSpotStream;
