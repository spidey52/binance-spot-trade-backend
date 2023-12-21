import { Router } from "express";
import PriceListenerController from "../controllers/price.listener.controller";

const priceListenerRouter = Router();

priceListenerRouter.get("/", PriceListenerController.fetchPriceListeners);
priceListenerRouter.post("/", PriceListenerController.createPriceListener);
priceListenerRouter.patch("/:id", PriceListenerController.updatePriceListener);
priceListenerRouter.delete("/:id", PriceListenerController.deletePriceListener);

export default priceListenerRouter;
