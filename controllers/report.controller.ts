import { Request, Response } from "express";
import moment from "moment";
import FutureTradeModel from "../models/future/future.trade.models";

type GroupValue = "D" | "M" | "Y";

const fetchChartReport = async (req: Request, res: Response) => {
 try {
  const groupValue = req.query.groupValue as GroupValue;

  const report = await calculateGroupedReport(groupValue, {});

  return res.status(200).send({ report });
 } catch (error: any) {
  return res.status(500).send({ message: error.message });
 }
};

const calculateGroupedReport = async (groupValue: GroupValue = "M", filter: any) => {
 let format = "%Y-%m";

 if (groupValue === "D") format = "%Y-%m-%d";
 else if (groupValue === "Y") format = "%Y";

 const report = await FutureTradeModel.aggregate([
  {
   $match: {
    sellPrice: { $exists: true },
    ...filter,
   },
  },
  {
   $group: {
    _id: {
     sellTime: {
      $dateToString: {
       format: format,
       date: "$sellTime",
       timezone: "+05:30",
      },
     },
    },
    profit: {
     $sum: {
      $multiply: [{ $subtract: ["$sellPrice", "$buyPrice"] }, "$quantity"],
     },
    },
   },
  },
  {
   $sort: { _id: -1 },
  },

  {
   $project: {
    _id: 0,
    date: "$_id.sellTime",
    profit: 1,
    avg: 1,
   },
  },
 ]);
 //  console.log(report);

 let totalProfit = 0;
 let avg = 0;

 report.forEach((r, index) => {
  totalProfit += r.profit;
  avg = totalProfit / (index + 1);
  r.avg = +avg.toFixed(2);
  r.profit = +r.profit.toFixed(2);
  // r.date = new Date(r.date);
  // title = moment(r.date).format("DD-MM-YYYY");
  let title = "";

  if (groupValue === "D") {
   title = moment(r.date).format("DD-MM-YYYY");
  }

  if (groupValue === "M") {
   title = moment(r.date).format("MMMM YYYY");
  }

  if (groupValue === "Y") {
   title = moment(r.date).format("YYYY");
  }

  r.date = title;
 });
 return report;
};

const ReportController = { fetchChartReport, calculateGroupedReport };

export default ReportController;
