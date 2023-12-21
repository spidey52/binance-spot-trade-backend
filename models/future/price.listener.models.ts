import mongoose from "mongoose";

type Expression = "GTE" | "LTE";
type Event = "NOTIFY" | "TICKER_EDIT";

export interface IPriceListener extends mongoose.Document {
 symbol: string;
 price: number;
 event: Event;
 expression: Expression;
 active: boolean;
 payload: Object;
 createdAt: Date;
 updatedAt: Date;
}

const priceListenerSchema = new mongoose.Schema<IPriceListener>(
 {
  symbol: { type: String, required: true },
  price: { type: Number, required: true },
  expression: { type: String, required: true },
  event: { type: String, required: true },
  payload: { type: Object, required: false, default: {} },
 },
 { timestamps: true }
);

const PriceListenerModel = mongoose.model<IPriceListener>("PriceListener", priceListenerSchema);

export default PriceListenerModel;
