import { handleInternalError } from "./../error/error.handler";
import { Router, Request, Response } from "express";
import TradeModel from "../models/trades.models";
import UserModel from "../models/users.models";

const router = Router();
const user = "63beffd81c1312d53375a43f";

router.get("/", async (req: Request, res: Response) => {
 try {
  const { status, symbol, date, page, limit } = req.query;

  const searchQuery: any = { user };

  if (status === "OPEN") searchQuery.sellPrice = { $exists: false };
  if (status === "CLOSED") searchQuery.sellPrice = { $exists: true };
  const filterDate = date ? new Date(date as string) : new Date();
  filterDate.setHours(0, 0, 0, 0);
  if (date) searchQuery.updatedAt = { $gte: filterDate };
  if (symbol) searchQuery.symbol = symbol;

  const allTrades = await TradeModel.find(searchQuery)
   .sort({ updatedAt: -1 })
   .limit(limit ? Number(limit) : 10)
   .skip(page ? Number(page) * Number(limit) : 0);

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
  return res.status(200).send({ allTrades, totalProfit, total: count });
 } catch (error: any) {
  handleInternalError(req, res, error);
 }
});

router.get("/profit", async (req: Request, res: Response) => {
 const date = new Date();
 date.setHours(0, 0, 0, 0);
 try {
  const todayProfit = await TradeModel.aggregate([
   {
    $match: {
     sellPrice: { $exists: true },
     sellTime: { $gte: date },
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
  const totalProfit = await TradeModel.aggregate([
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
  ]);

  return res.status(200).send({ todayProfit, totalProfit });
 } catch (error) {}
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
