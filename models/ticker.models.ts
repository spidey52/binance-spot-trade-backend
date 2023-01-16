import { model } from 'mongoose';
import { Schema } from 'mongoose';

const tickerSchema = new Schema({
	symbol: { type: String, required: true, unique: true },
},
	{
		timestamps: true,
	})


const TickerModel = model("Ticker", tickerSchema);

export default TickerModel;
