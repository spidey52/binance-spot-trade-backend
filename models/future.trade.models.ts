import { model, Schema } from "mongoose";

const futureTradeSchema = new Schema({
 user: { type: Schema.Types.ObjectId, ref: "User" },
 orderId: { type: String},
 symbol: { type: String },
 realizedProfit: { type: Number },
 date: { type: Date },
});

const FutureTradeModel = model("FutureTrade", futureTradeSchema);


export default FutureTradeModel;