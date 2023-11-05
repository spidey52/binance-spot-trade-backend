import { handleInternalError } from "./../error/error.handler";
import { Router, Request, Response } from "express";
import TradeModel from "../models/trades.models";
import FutureTradeModel from "../models/future/future.trade.models";
import { futureExchange } from "../lib/utils/order.future";
import moment from "moment";

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

router.get("/future/card", getCardReport);

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
const dateHelper = () => {
 const today = moment().startOf("day");
 const yesterday = moment(today).subtract(1, "days").startOf("day");
 const tomorrow = moment(today).add(1, "days").startOf("day");
 const lastWeek = moment(today).subtract(7, "days").startOf("day");
 const currentMonth = moment(today).startOf("month").startOf("day");
 const lastMonth = moment(today).subtract(1, "months").startOf("day");
 const lastYear = moment(today).subtract(1, "years").startOf("day");

 return {
  today,
  yesterday,
  tomorrow,
  lastWeek,
  currentMonth,
  lastMonth,
  lastYear,
 };
};

async function getCardReport(req: Request, res: Response) {
 try {
  const { today, tomorrow, yesterday, lastWeek, currentMonth, lastMonth, lastYear } = dateHelper();
  const group = {
   _id: null,
   profit: {
    $sum: {
     $multiply: [{ $subtract: ["$sellPrice", "$buyPrice"] }, "$quantity"],
    },
   },
  };
  const reports = await FutureTradeModel.aggregate([
   {
    $match: {
     sellPrice: { $exists: true },
    },
   },
   {
    $facet: {
     today: [
      {
       $match: {
        sellTime: {
         $gte: today.startOf("day").toDate(),
         $lte: today.endOf("day").toDate(),
        },
       },
      },
      {
       $group: group,
      },
     ],
     yesterday: [
      {
       $match: {
        sellTime: {
         $gte: yesterday.startOf("day").toDate(),
         $lte: yesterday.endOf("day").toDate(),
        },
       },
      },
      {
       $group: group,
      },
     ],

     lastWeek: [
      {
       $match: {
        sellTime: {
         $gte: lastWeek.startOf("day").toDate(),
        },
       },
      },
      {
       $group: group,
      },
     ],

     currentMonth: [
      {
       $match: {
        sellTime: {
         $gte: currentMonth.startOf("day").toDate(),
        },
       },
      },
      {
       $group: group,
      },
     ],

     total: [
      {
       $group: group,
      },
     ],
    },
   },
   {
    $project: {
     today: { $arrayElemAt: ["$today", 0] },
     yesterday: { $arrayElemAt: ["$yesterday", 0] },
     lastWeek: { $arrayElemAt: ["$lastWeek", 0] },
     currentMonth: { $arrayElemAt: ["$currentMonth", 0] },
     total: { $arrayElemAt: ["$total", 0] },
    },
   },
   {
    $project: {
     today: "$today.profit",
     yesterday: "$yesterday.profit",
     LastSevenDays: "$lastWeek.profit",
     currentMonth: "$currentMonth.profit",
     total: "$total.profit",
    },
   },
  ]);

  const result: { title: string; profit: number }[] = [];

  const report = reports[0];

  if (!report) return res.status(200).json({ result: [] });

  for (const key in report) {
   const value = report[key];

   result.push({
    title: key,
    profit: value,
   });
  }

  return res.status(200).json({ result });
 } catch (error) {
  return handleInternalError(req, res, error);
 }
}

export default router;
