import { model, Schema } from "mongoose";

const tradeSchema = new Schema(
 {
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  symbol: { type: String, required: true },
  buyPrice: { type: Number, required: true },
  sellPrice: { type: Number },
  binanceOrderId: { type: String },
  quantity: { type: Number, required: true },
  reorder: { type: Boolean, default: true },
 },
 {
  timestamps: true,
 }
);

const TradeModel = model("Trade", tradeSchema);

export default TradeModel;
