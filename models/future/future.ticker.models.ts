import { model } from "mongoose";
import { Schema } from "mongoose";

const tickerSchema = new Schema(
 {
  symbol: { type: String, required: true, unique: true },
  buyPercent: { type: Number, required: true, default: 2 },
  sellPercent: { type: Number, required: true, default: 2 },
  rob: { type: Boolean, required: true, default: true, description: "reorder on buy" },
  ros: { type: Boolean, required: true, default: true, description: "reorder on sell" },
  oomp: { type: Boolean, required: true, default: false },
  amount: { type: Number, required: true },
  maxPendingOrders: { type: Number, required: true, default: 10 },
  precision: { type: Number, required: true, default: 4 },
 },
 {
  timestamps: true,
 }
);

const FutureTickerModel = model("FutureTicker", tickerSchema);

export default FutureTickerModel;
