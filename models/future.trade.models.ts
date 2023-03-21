import { model, Schema } from "mongoose";

const futureTradeSchema = new Schema(
 {
  user: { type: Schema.Types.ObjectId, ref: "User" },
  orderId: { type: String },
  symbol: { type: String },
  quantity: { type: Number },
  buyPrice: { type: Number },
  sellPrice: { type: Number },
  buyTime: { type: Date },
  sellTime: { type: Date },
 },
 {
  timestamps: true,
	}
);

const FutureTradeModel = model("FutureTrade", futureTradeSchema);

export default FutureTradeModel;
