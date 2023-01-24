import { getOrders } from "../lib/trade.sync";
import { Router } from "express";
import { handleInternalError } from "../error/error.handler";

const router = Router();

router.get("/", async (req, res) => {
 try {
  const allOrders = await getOrders();
  return res.status(200).send(allOrders);
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

export default router;
