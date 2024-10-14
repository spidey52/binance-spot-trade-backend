import { Request, Response, Router } from "express";
import FutureTickerModel from "../models/future/future.ticker.models";
import TickerModel from "../models/ticker.models";
import { handleInternalError } from "./../error/error.handler";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
 try {
  const isFuture = req.query.future;
  const allTickers = await TickerModel.find();

  if (isFuture) {
   const allFutureTickers = await FutureTickerModel.find();
   return res.status(200).send(allFutureTickers);
  }

  return res.status(200).send(allTickers);
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

router.post("/", async (req, res) => {
 try {
  const { ticker } = req.body;
  const newTicker = await TickerModel.create({ symbol: ticker });
  return res.status(201).send(newTicker);
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

router.post("/future", async (req, res) => {
 try {
  const body = req.body;
  const newTicker = await FutureTickerModel.create(body);
  return res.status(201).send(newTicker);
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

router.patch("/future/:id", async (req, res) => {
 try {
  const { id } = req.params;
  const body = req.body;
  const updatedTicker = await FutureTickerModel.findOneAndUpdate({ _id: id }, body, { new: true });
  if (!updatedTicker) return res.status(400).send({ message: "Ticker not found" });
  return res.status(200).send(updatedTicker);
 } catch (error) {
  return handleInternalError(req, res, error);
 }
});

router.delete("/:id", async (req, res) => {
 try {
  const { id } = req.params;
  await TickerModel.findByIdAndDelete(id);
  return res.status(200).send("Ticker deleted");
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

export default router;
