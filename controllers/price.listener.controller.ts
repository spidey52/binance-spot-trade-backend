import { Request, Response } from "express";
import { handleInternalError } from "../error/error.handler";
import PriceListenerModel from "../models/future/price.listener.models";

const PriceListenerController = {
 fetchPriceListeners,
 createPriceListener,
 updatePriceListener,
 deletePriceListener,
};

type SearchQuery = {
 symbol?: string;
 event?: "NOTIFY" | "TICKER_EDIT";
 expression?: "GTE" | "LTE";
 active?: boolean;
};

async function fetchPriceListeners(req: Request, res: Response) {
 try {
  const { symbol, event, expression, active } = req.query;
  const searchQuery: SearchQuery = {};

  if (symbol) searchQuery.symbol = symbol as string;
  if (event) searchQuery.event = event as "NOTIFY" | "TICKER_EDIT";

  if (expression) searchQuery.expression = expression as "GTE" | "LTE";

  if (active) searchQuery.active = active === "true";

  const listners = await PriceListenerModel.find(searchQuery);
  const listnersCount = await PriceListenerModel.countDocuments(searchQuery);

  return res.status(200).send({ data: listners, count: listnersCount });
 } catch (error) {
  return handleInternalError(req, res, error);
 }
}

async function createPriceListener(req: Request, res: Response) {
 try {
  const { symbol, price, event, expression, payload } = req.body;
  const newListener = await PriceListenerModel.create({ symbol, price, event, expression, payload });
  return res.status(201).send(newListener);
 } catch (error) {
  return handleInternalError(req, res, error);
 }
}

async function updatePriceListener(req: Request, res: Response) {
 try {
  const { id } = req.params;
  const { symbol, active, price, event, expression, payload } = req.body;

  const updatedListener = await PriceListenerModel.findByIdAndUpdate(id, { symbol, price, active, event, expression, payload }, { new: true });

  return res.status(200).send(updatedListener);
 } catch (error) {
  return handleInternalError(req, res, error);
 }
}

async function deletePriceListener(req: Request, res: Response) {
 try {
  const { id } = req.params;

  const isActive = await PriceListenerModel.findById(id).select("active");
  if (!isActive) return res.status(400).send({ message: "Price listener not found" });
  if (isActive.active) return res.status(400).send({ message: "Price listener is active inActive it first to delete." });

  await PriceListenerModel.findByIdAndDelete(id);

  return res.status(200).send({ message: "Price listener deleted" });
 } catch (error) {
  return handleInternalError(req, res, error);
 }
}

export default PriceListenerController;
