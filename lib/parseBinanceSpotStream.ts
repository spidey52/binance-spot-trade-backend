import { handleBuyNotification, handleSellNotification } from "./utils/notificationHandler";
import { createBuyOrder, findPendingOrderByPrice, getTickerDetails } from "./utils/orders.utils";
import { getBuyPrice, getSellPrice } from "./utils/getPercent";
import TradeModel from "../models/trades.models";
import exchange from "./exchange.conn";
import OrdersModel from "../models/orders.models";
import TickerModel from "../models/ticker.models";

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

 const { e: eventType, S: side, s: symbol, p: price, q: quantity, x: executionType, i: orderId } = data;

 if (eventType === "executionReport") {
  //  console.log(executionType);
  const { buyPercent: buyOrderPercent, sellPercent: sellOrderPercent, loopEnabled, precision } = await getTickerDetails(symbol);

  try {
   if (executionType === "NEW") {
    await OrdersModel.create({
     orderId,
     symbol,
     price: Number(price).toFixed(precision),
     quantity,
     side,
     status: "NEW",
     user: "63beffd81c1312d53375a43f",
     executedQty: 0,
    });
   }

   if (executionType === "CANCELED") {
    await OrdersModel.findOneAndUpdate({ orderId }, { status: "CANCELED" });
   }

   if (executionType === "REJECTED") {
    await OrdersModel.findOneAndUpdate({ orderId }, { status: "REJECTED" });
   }

   if (executionType === "TRADE") {
    await OrdersModel.findOneAndUpdate({ orderId }, { status: "TRADE", executedQty: { $inc: quantity } });
   }
  } catch (error: any) {
   console.log("Error in parsing binance spot stream", error.message);
  }

  if (executionType === "TRADE") {
   if (side === "BUY") {
    // create new trade
    await TradeModel.create({
     buyPrice: price,
     quantity,
     symbol,
     user: "63beffd81c1312d53375a43f",
    });

    await exchange.createLimitSellOrder(symbol, quantity, getSellPrice(price, sellOrderPercent));
    await handleBuyNotification({ symbol, price });

    if (loopEnabled === false) return;
    await createBuyOrder(symbol, quantity, getBuyPrice(price, buyOrderPercent));
    return;
   }
   if (side === "SELL") {
    const trade = await findMinValueTrade(symbol, quantity);
    if (!trade) return;
    const updatedTrade = await TradeModel.findByIdAndUpdate(trade._id, {
     sellPrice: price,
    });

    if (!updatedTrade) {
     console.log("No trade found", symbol, quantity, updatedTrade, "line number 59");
     return;
    }
    if (updatedTrade.reorder === false) return;
    console.log("New order starting", symbol, quantity, updatedTrade.buyPrice, "line number 63");
    const isExists = await findPendingOrderByPrice(symbol, updatedTrade.buyPrice);
    if (isExists) return;
    await exchange.createLimitBuyOrder(symbol, quantity, updatedTrade?.buyPrice);
    console.log("New order created", symbol, quantity, updatedTrade?.buyPrice, "line number 65");
    const profit = (price - (updatedTrade?.buyPrice || price)) * quantity;
    await handleSellNotification({
     symbol,
     price,
     profit,
    });
   }
  }
 }
};
export default parseBinanaceSpotStream;
