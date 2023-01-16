import { handleInternalError } from './../error/error.handler';
import { Router } from "express";
import TickerModel from "../models/ticker.models";

const router = Router();

router.get("/", async (req, res) => {
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

router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		await TickerModel.findByIdAndDelete(id);
		return res.status(200).send('Ticker deleted');
	} catch (error) {
		handleInternalError(req, res, error);
	}
});

export default router;