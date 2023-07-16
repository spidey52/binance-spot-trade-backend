import ccxt from "ccxt";
import { getOrders, cancelOrder, getOrdersBySymbol } from "../lib/trade.sync";
import { Request, Response, Router } from "express";
import { handleInternalError } from "../error/error.handler";
import OrdersModel from "../models/orders.models";
import FutureTradeModel from "../models/future/future.trade.models";
import TickerModel from "../models/ticker.models";
import TradeModel from "../models/trades.models";
import { futureExchange } from "../lib/utils/order.future";
import FutureTickerModel from "../models/future/future.ticker.models";
import axios from "axios";

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
 const { symbol } = req.query;
 try {
  const ticker = await FutureTickerModel.findOne({
   symbol: {
    $regex: symbol || "",
    $options: "i",
   },
  });

  if (!ticker) return res.status(400).send({ message: "Ticker not found" });

  const orders = await futureExchange.fetchOpenOrders(ticker.symbol);

  const initialState: { buy: any[]; sell: any[] } = {
   buy: [],
   sell: [],
  };

  const response = orders
   .map((o) => ({
    id: o.id,
    symbol: o.info.symbol,
    orderId: o.info.orderId,
    clientId: o.info.clientOrderId,
    side: o.side,
    price: o.price,
    amount: o.amount,
   }))
   .sort((a, b) => a.price - b.price)
   .reduce((acc, cur) => {
    if (cur.side === "buy") acc.buy.push(cur);
    else acc.sell.push(cur);
    return acc;
   }, initialState);

  return res.status(200).send(response);
 } catch (error) {
  return handleInternalError(req, res, error);
 }
});

router.post("/future/place", async (req, res) => {
 try {
  const { symbol, side, price, amount } = req.body;

  if (!symbol || !side || !price || !amount) return res.status(400).send({ message: "Missing required fields" });

  const order = await futureExchange.createLimitOrder(symbol, side, amount, price);
  return res.status(200).send({ message: "order placed succesfully" });
 } catch (error) {
  return handleInternalError(req, res, error);
 }
});

router.post("/future/replace-all", async (req, res) => {
 try {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).send({ message: "Missing required fields" });

  const ticker = await FutureTickerModel.findOne({ symbol });
  if (!ticker) return res.status(400).send({ message: "Ticker not found" });

  const pendingTrades = await FutureTradeModel.find({ symbol, sellPrice: { $exists: false } });

  const sellOrderPrice = pendingTrades
   .map((el) => {
    if (!el.buyPrice) return 0;
    return el.buyPrice * (1 + ticker.sellPercent / 100);
   })
   .filter((el) => el !== 0);

  for (let orderPrice of sellOrderPrice) {
   if (!ticker.amount) return res.status(400).send({ message: "Ticker amount not found" });
   await futureExchange.createLimitOrder(symbol, "sell", ticker.amount, orderPrice);
  }

  return res.status(200).send({ message: "order placed succesfully" });
 } catch (error) {
  return handleInternalError(req, res, error);
 }
});

router.post("/future/cancel", async (req, res) => {
 try {
  const { ids, symbol } = req.body;
  if (!symbol) return res.status(400).send({ message: "Missing required fields symbol" });

  for (let id of ids) {
   await futureExchange.cancelOrder(id, symbol as string);
  }
  return res.status(200).send({ message: "order cancelled succesfully" });
 } catch (error) {
  return handleInternalError(req, res, error);
 }
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
