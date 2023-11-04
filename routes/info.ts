import { Router, Request, Response } from "express";
import { futureExchange } from "../lib/utils/order.future";

const router = Router();

router.get("/balancel");

// controllers

const fetchBalance = async (req: Request, res: Response) => {
 try {
  const balance = await futureExchange.fetchBalance();
  // const multi = futureExchange.hasCancelOrders
  return res.status(200).json(balance);
 } catch (error) {
  return res.status(500).json(error);
 }
};
