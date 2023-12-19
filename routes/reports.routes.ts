import { Request, Response, Router } from "express";
import moment from "moment";
import ReportController from "../controllers/report.controller";
import FutureTradeModel from "../models/future/future.trade.models";
import { handleInternalError } from "./../error/error.handler";

const router = Router();

router.get("/chart", ReportController.fetchChartReport);

router.get("/future/symbol", async (req, res) => {
 try {
  const reports = await futureProfitBySymbol();
  return res.status(200).json(reports);
 } catch (error) {
  return res.status(500).json(error);
 }
});

router.get("/future/card", getCardReport);

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
