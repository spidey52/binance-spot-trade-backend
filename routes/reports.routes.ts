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
     $addFields: {
        sellTime: { $toDate: "$sellTime" },
    }
  },
  {
   $group: {
    _id: {
     updatedAt: { $dateToString: { format: "%Y-%m-%d", date: "$sellTime", timezone: "+05:30" } },
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

 let totalProfit = 0;
 let count = 0;
 reports.map((report) => {
  count++;
  totalProfit += report.profit;
  const avgProfit = totalProfit / count;
  report.avgProfit = avgProfit;
  report.totalProfit = totalProfit;

  return report;
 });

 return reports;
};

export default router;
