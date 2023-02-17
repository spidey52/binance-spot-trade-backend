import { model, Schema } from "mongoose";

const snapshotSchema = new Schema(
 {
  tickers: [
   {
    ticker: String,
    amount: Number,
   },
  ],
  totalAmount: {
   type: Number,
   required: true,
  },
 },
 {
  timestamps: true,
 }
);

const SnapshotModel = model("Snapshot", snapshotSchema);

export default SnapshotModel;
