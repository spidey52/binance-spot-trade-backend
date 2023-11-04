import { Router, Request, Response } from "express";
import { getBinanceOrders } from "../lib/utils/orders.utils";
import { handleInternalError } from "../error/error.handler";
import { futureExchange } from "../lib/utils/order.future";

const binanceRouter = Router();

binanceRouter.get("/orders", async (req, res) => {
 try {
  const search = (req.query.search as string) || "";

  const orders = getBinanceOrders(search);

  return res.status(200).send(orders);
 } catch (error) {
  return handleInternalError(req, res, error);
 }
});

binanceRouter.get("/balance", async (req: Request, res: Response) => {
 try {
  const balance = await futureExchange.fetchBalance();

  return res.status(200).send(balance);
 } catch (error) {
  return handleInternalError(req, res, error);
 }
});

export default binanceRouter;
