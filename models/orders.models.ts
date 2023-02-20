import mongoose from "mongoose";

const OrdersSchema = new mongoose.Schema({
 user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
 symbol: { type: String, required: true },
 orderId: { type: Number, required: true },
 price: { type: Number, required: true },
 quantity: { type: Number, required: true },
 executedQty: { type: Number, required: true },
 status: { type: String, required: true },
 side: { type: String, required: true },
});

const OrdersModel = mongoose.model("Orders", OrdersSchema);

export default OrdersModel;
