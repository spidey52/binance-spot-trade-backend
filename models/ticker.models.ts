import { model } from 'mongoose';
import { Schema } from 'mongoose';

const tickerSchema = new Schema({
	symbol: { type: String, required: true, unique: true },
	buyPercent: { type: Number, required: true, default: 2 },
	sellPercent: { type: Number, required: true, default: 2 },
	loopEnabled: { type: Boolean, required: true, default: true },
},
	{
		timestamps: true,
	})


const TickerModel = model("Ticker", tickerSchema);

export default TickerModel;
