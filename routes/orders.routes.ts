import { getOrders, cancelOrder, getOrdersBySymbol } from "../lib/trade.sync";
import { Request, Response, Router } from "express";
import { handleInternalError } from "../error/error.handler";

const router = Router();

router.get("/", async (req, res) => {
 try {
  const { symbol, side } = req.query;
  const allOrders = await getOrders(symbol as string, side as string);
  return res.status(200).send(allOrders);
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
