import { handleInternalError } from "./../error/error.handler";
import { Router, Request, Response } from "express";
import TradeModel from "../models/trades.models";
import UserModel from "../models/users.models";
import FutureTradeModel from "../models/future/future.trade.models";
import mongoose, { Model, model } from "mongoose";

const router = Router();
const user = "63beffd81c1312d53375a43f";

router.get("/", async (req: Request, res: Response) => {
 try {
  const { status, symbol, date, page, limit, market } = req.query;

  const searchQuery: any = {};

  if (status === "OPEN") searchQuery.sellPrice = { $exists: false };
  if (status === "CLOSED") searchQuery.sellPrice = { $exists: true };
  const filterDate = date ? new Date(date as string) : new Date();
  filterDate.setHours(0, 0, 0, 0);
  if (date) searchQuery.updatedAt = { $gte: filterDate };
  if (symbol) searchQuery.symbol = { $regex: (symbol as string).trim(), $options: "i" };
  const mypage = page ? parseInt(page as string) : 0;
  const mylimit = limit ? parseInt(limit as string) : 10;

  const { allTrades, totalProfit, total } = await fetchTrades({ searchQuery, page: mypage, limit: mylimit, filterDate }, market ? market.toString() : "SPOT");

  return res.status(200).send({ allTrades, totalProfit, total });
 } catch (error: any) {
  handleInternalError(req, res, error);
 }
});

router.get("/profit", async (req: Request, res: Response) => {
 const { market } = req.query;

 const date = new Date();
 date.setHours(0, 0, 0, 0);

 let dbmodel = "Trade";
 let sellTime: Date | number = date.getTime();
 console.log(market);
 if (market === "FUTURE") {
  dbmodel = "FutureTrade";
  sellTime = date;
 }

 try {
  const todayProfit = await model(dbmodel).aggregate([
   {
    $match: {
     sellPrice: { $exists: true },
     sellTime: { $gte: sellTime },
    },
   },
   {
    $group: {
     _id: null,
     sum: {
      $sum: {
       $multiply: [{ $subtract: ["$sellPrice", "$buyPrice"] }, "$quantity"],
      },
     },
    },
   },
   {
    $project: {
     _id: 0,
     sum: 1,
    },
   },
  ]);
  const totalProfit = await model(dbmodel).aggregate([
   {
    $match: {
     sellPrice: { $exists: true },
    },
   },
   {
    $group: {
     _id: null,
     sum: {
      $sum: {
       $multiply: [{ $subtract: ["$sellPrice", "$buyPrice"] }, "$quantity"],
      },
     },
    },
   },
   {
    $project: {
     _id: 0,
     sum: 1,
    },
   },
  ]);

  return res.status(200).send({ todayProfit: todayProfit[0]?.sum || 0, totalProfit: totalProfit[0]?.sum || 0 });
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

router.get("/profit-category", async (req: Request, res: Response) => {
 try {
  const { frequency } = req.query;

  if (frequency === "daily") {
   const trades = await FutureTradeModel.aggregate([
    {
     $match: {
      sellPrice: { $exists: true },
     },
    },
    {
     $group: {
      _id: {
       sellTime: { $dateToString: { format: "%Y-%m-%d", date: "$sellTime", timezone: "+05:30" } },
       symbols: "$symbol",
      },
      profit: {
       $sum: {
        $multiply: [{ $subtract: ["$sellPrice", "$buyPrice"] }, "$quantity"],
       },
      },

      count: { $sum: 1 },
      invested: { $sum: { $multiply: ["$buyPrice", "$quantity"] } },
     },
    },
    {
     $group: {
      _id: "$_id.sellTime",
      totalProfit: { $sum: "$profit" },
      totalInvested: { $sum: "$invested" },
      totalTrades: { $sum: "$count" },
      symbols: {
       $push: {
        symbol: "$_id.symbols",
        profit: "$profit",
        count: "$count",
        invested: "$invested",
       },
      },
     },
    },
    {
     $sort: {
      _id: -1,
     },
    },
    {
     $project: {
      _id: 0,
      date: "$_id",
      symbols: 1,
      totalProfit: 1,
      totalInvested: 1,
      totalTrades: 1,
     },
    },
   ]);

   return res.status(200).send(trades);
  }
 } catch (error) {
  return handleInternalError(req, res, error);
 }
});

router.post("/", (req: Request, res: Response) => {
 try {
  const { symbol, buyPrice, sellPrice, quantity, createdAt } = req.body;
  const trade = TradeModel.create({
   user,
   symbol,
   buyPrice,
   sellPrice,
   quantity,
   createdAt,
  });
  return res.status(201).send(trade);
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

router.patch("/:id", async (req: Request, res: Response) => {
 try {
  const { id } = req.params;
  const { sellPrice } = req.body;
  console.log(req.body);
  const trade = await TradeModel.findByIdAndUpdate(id, { sellPrice }, { new: true });
  return res.status(200).send(trade);
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

router.get("/:id", async (req: Request, res: Response) => {
 try {
  const { id } = req.params;
  const { sellPrice } = req.body;
  const trade = await TradeModel.findByIdAndUpdate(id, { sellPrice }, { new: true });
  return res.status(200).send(trade);
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

router.delete("/:id", async (req: Request, res: Response) => {
 try {
  const { id } = req.params;
  const trade = await TradeModel.findByIdAndDelete(id);
  return res.status(200).send(trade);
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

export default router;

type TradeParams = {
 searchQuery: any;
 limit?: any;
 page?: any;
 filterDate: Date;
};

async function fetchTrades({ searchQuery, limit, page, filterDate }: TradeParams, model: string) {
 if (model.toUpperCase() === "FUTURE") {
  return fetchFutureTrades({ searchQuery, limit, page, filterDate });
 } else {
  return fetchSpotTrades({ searchQuery, limit, page, filterDate });
 }
}

async function fetchFutureTrades({ searchQuery, limit, page, filterDate }: TradeParams) {
 const allTrades = await FutureTradeModel.find(searchQuery)
  .sort({ updatedAt: -1 })
  .limit(limit ? Number(limit) : 10)
  .skip(page ? Number(page) * Number(limit) : 0);

 const count = await FutureTradeModel.countDocuments(searchQuery);

 const totalProfit = await FutureTradeModel.aggregate([
  {
   $match: {
    sellPrice: { $exists: true },
    sellTime: { $gte: filterDate },
   },
  },
  {
   $group: {
    _id: null,
    sum: {
     $sum: {
      $multiply: [{ $subtract: ["$sellPrice", "$buyPrice"] }, "$quantity"],
     },
    },
   },
  },
 ]);

 return { allTrades, totalProfit, total: count };
}

async function fetchSpotTrades({ searchQuery, limit, page, filterDate }: TradeParams) {
 const allTrades = await TradeModel.find(searchQuery)
  .sort({ updatedAt: -1 })
  .limit(limit ? Number(limit) : 10)
  .skip(page ? Number(page) * Number(limit) : 0);

 console.log(allTrades, "allTrades", searchQuery);

 const count = await TradeModel.countDocuments(searchQuery);

 const totalProfit = await TradeModel.aggregate([
  {
   $match: {
    sellPrice: { $exists: true },
    sellTime: { $gte: filterDate.getTime() },
   },
  },
  {
   $group: {
    _id: null,
    sum: {
     $sum: {
      $multiply: [{ $subtract: ["$sellPrice", "$buyPrice"] }, "$quantity"],
     },
    },
   },
  },
 ]);

 return { allTrades, totalProfit, total: count };
}

