import {
 createBuyOrder,
 findPendingOrderByPrice,
 getTickerDetails,
} from "./utils/orders.utils";
import { getBuyPrice, getSellPrice } from "./utils/getPercent";
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
 console.log("Binance Spot Stream Data", new Date().toString());

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

    const {
     buyPercent: buyOrderPercent,
     sellPercent: sellOrderPercent,
     loopEnabled,
    } = await getTickerDetails(symbol);

    await exchange.createLimitSellOrder(
     symbol,
     quantity,
     getSellPrice(price, sellOrderPercent)
    );

    if (loopEnabled === false) return;
    return await createBuyOrder(
     symbol,
     quantity,
     getBuyPrice(price, buyOrderPercent)
    );
   }
   if (side === "SELL") {
    const trade = await findMinValueTrade(symbol, quantity);
    if (!trade) return;
    const updatedTrade = await TradeModel.findByIdAndUpdate(trade._id, {
     sellPrice: price,
    });

    // create new order
    if (!updatedTrade) {
     console.log(
      "No trade found",
      symbol,
      quantity,
      updatedTrade,
      "line number 59"
     );
     return;
    }
    console.log(
     "New order starting",
     symbol,
     quantity,
     updatedTrade.buyPrice,
     "line number 63"
    );
    const isExists = await findPendingOrderByPrice(
     symbol,
     updatedTrade.buyPrice
    );
    if (isExists) return;
    await exchange.createLimitBuyOrder(
     symbol,
     quantity,
     updatedTrade?.buyPrice
    );
    console.log(
     "New order created",
     symbol,
     quantity,
     updatedTrade?.buyPrice,
     "line number 65"
    );
   }
  }
 }
};

export default parseBinanaceSpotStream;
