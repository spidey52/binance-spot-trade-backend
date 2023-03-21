import { handleInternalError } from "./../error/error.handler";
import { Router, Request, Response } from "express";
import TickerModel from "../models/ticker.models";
import FutureTickerModel from "../models/future.ticker.models";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
 try {
  const allTickers = await TickerModel.find();
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

router.patch("/:id", async (req: Request, res: Response) => {
 try {
  const { id } = req.params;
  const updatedTicker = await TickerModel.findByIdAndUpdate(id, { ...req.body }, { new: true });
  return res.status(200).send(updatedTicker);
 } catch (error) {
  handleInternalError(req, res, error);
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
