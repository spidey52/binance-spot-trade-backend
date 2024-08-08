import { Request, Response } from "express";
import { handleInternalError } from "../error/error.handler";
import FutureTradeModel from "../models/future/future.trade.models";
import { GroupedCompletedTrades, GroupedPendingTrades } from "../types/trade.types";
import { kCalculateInvestment, kCalculateSellPrice, kCompletedTradesFilter, kPendingTradesFilter } from "./../utils/trades.utils";

const groupedPendingTrades = async (req: Request, res: Response) => {
 try {
  const trades: GroupedPendingTrades[] = await FutureTradeModel.aggregate([
   {
    $match: kPendingTradesFilter,
   },
   {
    $group: {
     _id: "$symbol",
     trades: { $push: "$$ROOT" },
     totalQty: { $sum: "$quantity" },
     tradeCount: { $sum: 1 },
     investment: { $sum: kCalculateInvestment },
    },
   },
   {
    $sort: { investment: -1 },
   },
   {
    $project: {
     _id: 0,
     symbol: "$_id",
     totalQty: 1,
     tradeCount: 1,
     investment: 1,
     avgBuyPrice: { $divide: ["$investment", "$totalQty"] },
    },
   },
  ]);

  return res.status(200).send({ result: trades });
 } catch (error) {
  return handleInternalError(req, res, error);
 }
};

const groupedCompletedTrades = async (req: Request, res: Response) => {
 try {
  const trades: GroupedCompletedTrades[] = await FutureTradeModel.aggregate([
   {
    $match: kCompletedTradesFilter,
   },

   {
    $group: {
     _id: "$symbol",
     trades: { $push: "$$ROOT" },
     totalQty: { $sum: "$quantity" },
     tradeCount: { $sum: 1 },
     investment: { $sum: kCalculateInvestment },
     sellPrice: { $sum: kCalculateSellPrice },
    },
   },
   {
    $addFields: {
     profit: { $subtract: ["$sellPrice", "$investment"] },
    },
   },
   {
    $sort: { profit: -1 },
   },
   {
    $project: {
     _id: 0,
     symbol: "$_id",
     totalQty: 1,
     tradeCount: 1,
     investment: 1,
     sellPrice: 1,
     profit: 1,
     avgBuyPrice: { $divide: ["$investment", "$totalQty"] },
     avgSellPrice: { $divide: ["$sellPrice", "$totalQty"] },
    },
   },
  ]);

  return res.status(200).send({ result: trades });
 } catch (error) {
  return handleInternalError(req, res, error);
 }
};

const TradeController = { groupedPendingTrades, groupedCompletedTrades };

export default TradeController;
