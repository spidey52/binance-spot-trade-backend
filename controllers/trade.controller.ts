import { Request, Response } from "express";
import { handleInternalError } from "../error/error.handler";
import FutureTradeModel from "../models/future/future.trade.models";
import { GroupedPendingTrades } from "../types/trade.types";
import { kCalculateInvestment, kPendingTradesFilter } from "./../utils/trades.utils";

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
     avgBuyPrice: { $avg: "$buyPrice" },
     totalQty: { $sum: 1 },
     investment: { $sum: kCalculateInvestment },
    },
   },
  ]);

  return res.status(200).send({ result: trades });
 } catch (error) {
  return handleInternalError(req, res, error);
 }
};

const groupedCompletedTrades = async (req: Request, res: Response) => {
 return res.status(200).send({ message: "Not implemented" });
};

const TradeController = { groupedPendingTrades, groupedCompletedTrades };

export default TradeController;
