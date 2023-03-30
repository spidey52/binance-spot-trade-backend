import { OPEN_ORDERS } from "./../lib/utils/order.future";
import ccxt from "ccxt";
import { getOrders, cancelOrder, getOrdersBySymbol } from "../lib/trade.sync";
import { Request, Response, Router } from "express";
import { handleInternalError } from "../error/error.handler";
import OrdersModel from "../models/orders.models";
import FutureTradeModel from "../models/future.trade.models";
import TickerModel from "../models/ticker.models";

const router = Router();

router.get("/", async (req, res) => {
 try {
  const { symbol, side, status } = req.query;
  const searchQuery: any = {};
  if (symbol) searchQuery.symbol = symbol;
  if (side) searchQuery.side = side;
  if (status) searchQuery.status = status;
  else searchQuery.status = "NEW";

  const orders = await OrdersModel.find(searchQuery);

  return res.status(200).send(orders);
 } catch (error) {
  handleInternalError(req, res, error);
 }
});
router.get("/future", async (req, res) => {
 return res.send(OPEN_ORDERS);
});

router.post("/grid", async (req: Request, res: Response) => {
 const { symbol, initialPrice, percent, side, count, amount, isFuture } = req.body;

 try {
  if (!symbol || !initialPrice || !percent || !side || !count) return res.status(400).send({ message: "Missing required fields" });

  const exchange = new ccxt.binance({
   apiKey: process.env.API_KEY,
   secret: process.env.API_SECRET,
   options: {
    defaultType: isFuture ? "future" : "spot",
   },
  });

  let i = 0;
  const ticker = await TickerModel.findOne({ symbol });
  if (!ticker) return res.status(400).send({ message: "Ticker not found" });
  const { precision } = ticker;

  

  while (i < count) {
   if (side === "SELL") {
    const price = +(initialPrice * (1 + (percent / 100) * i)).toFixed(precision);

    try {
      console.log(price, amount, symbol);
     await exchange.createLimitSellOrder(symbol, amount, price);
    } catch (error: any) {
     console.log(error.message);
    }
   } else {
    const price = +(initialPrice * (1 - (percent / 100) * i)).toFixed(precision);
    try {
      console.log(price, amount, symbol);
     await exchange.createLimitBuyOrder(symbol, amount, price);
    } catch (error: any) {
     console.log(error.message);
    }
   }

   i++;
  }

  return res.status(200).send("Success");
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

router.get("/:id/cancel", async (req: Request, res: Response) => {
 try {
  const { id } = req.params;
  const { symbol } = req.query;
  const order = await cancelOrder(id, symbol as string);
  return res.status(200).send(order);
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

router.get("/:id", async (req: Request, res: Response) => {
 try {
  const { id } = req.params;
  const { symbol } = req.query;
  const order = await getOrdersBySymbol(symbol as string);
  return res.status(200).send(order);
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

export default router;

async () => {
 const futureOrders = await FutureTradeModel.aggregate([
  {
   $group: {
    _id: "$symbol",
    total: { $sum: "$quantity" },
    buy: { $sum: { $cond: [{ $eq: ["$side", "buy"] }, "$quantity", 0] } },
    sell: { $sum: { $cond: [{ $eq: ["$side", "sell"] }, "$quantity", 0] } },
   },
  },
 ]);

 console.log(futureOrders);
};
