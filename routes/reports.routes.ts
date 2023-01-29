import { handleInternalError } from "./../error/error.handler";
import { OrderImmediatelyFillable } from "ccxt";
import { Router } from "express";
import TradeModel from "../models/trades.models";

const router = Router();

router.get("/", async (req, res) => {
 try {
  const dailyReports = await getDailyReports();
  return res.status(200).json(dailyReports);
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

const getDailyReports = async () => {
 const reports = await TradeModel.aggregate([
  {
   $match: {
    sellPrice: { $exists: true },
   },
  },
  {
   $group: {
    _id: {
     updatedAt: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt", timezone: "+05:30" } },
    },
    profit: {
     $sum: {
      $multiply: [{ $subtract: ["$sellPrice", "$buyPrice"] }, "$quantity"],
     },
    },
   },
  },
  {
   $sort: {
    _id: 1,
   },
  },
 ]);

 return reports;
};

export default router;
