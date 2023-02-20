import { getOrders, cancelOrder, getOrdersBySymbol } from "../lib/trade.sync";
import { Request, Response, Router } from "express";
import { handleInternalError } from "../error/error.handler";
import OrdersModel from "../models/orders.models";

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
