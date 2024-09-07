import { Schema, model } from "mongoose";

export enum OrderStrategy {
 GRID_ORDRER = "GRID_ORDER",
 AUTO_ORDER = "AUTO_ORDER",
}

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
  ignoreStream: { type: Boolean, required: true, default: false }, // we can use it as inactive ticker
  strategy: {
   type: String,
   required: true,
   enum: Object.values(OrderStrategy),
   default: OrderStrategy.GRID_ORDRER,
  },
  roc: { type: Boolean, required: true, default: false, description: "cancel and place order on config update" },
 },
 {
  timestamps: true,
 }
);

const FutureTickerModel = model("FutureTicker", tickerSchema);

export default FutureTickerModel;
