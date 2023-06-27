import { handleInternalError } from "./../error/error.handler";
import { Router } from "express";
import TradeModel from "../models/trades.models";
import FutureTradeModel from "../models/future/future.trade.models";

const router = Router();

router.get("/", async (req, res) => {
 try {
  const isFuture = req.query.future;
  if (isFuture) {
   const dailyReports = await getFutureDailyReports();
   return res.status(200).json(dailyReports);
  }
  const dailyReports = await getDailyReports();
  return res.status(200).json(dailyReports);
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

router.get("/future", async (req, res) => {
 const reports = await getFutureTotalProfits();
 return res.status(200).json(reports);
});

router.get("/future/symbol", async (req, res) => {
 try {
  const reports = await futureProfitBySymbol();
  return res.status(200).json(reports);
 } catch (error) {
  return res.status(500).json(error);
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
   },
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

const getFutureDailyReports = async () => {
 const reports = await FutureTradeModel.aggregate([
  {
   $match: {
    sellPrice: { $exists: true },
   },
  },
  {
   $addFields: {
    sellTime: { $toDate: "$sellTime" },
   },
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

const getFutureTotalProfits = async () => {
 const allTrades = await FutureTradeModel.find({
  sellPrice: { $exists: true },
 });
 console.log(allTrades);
 const reports = await FutureTradeModel.aggregate([
  {
   $match: {
    sellPrice: { $exists: true },
   },
  },
  {
   $group: {
    _id: null,
    profit: {
     $sum: {
      $multiply: [{ $subtract: ["$sellPrice", "$buyPrice"] }, "$quantity"],
     },
    },
   },
  },
 ]);
 return reports;
};

export const futureProfitBySymbol = async () => {
 const reports = await FutureTradeModel.aggregate([
  {
   $match: {
    sellPrice: { $exists: true },
   },
  },
  {
   $group: {
    _id: "$symbol",
    profit: {
     $sum: {
      $multiply: [{ $subtract: ["$sellPrice", "$buyPrice"] }, "$quantity"],
     },
    },
   },
  },
 ]);
 return reports;
};

export default router;
