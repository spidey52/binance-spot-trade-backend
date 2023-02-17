import { model, Schema } from "mongoose";

const PriceListenerSchema = new Schema({
 ticker: { type: String, required: true },
 price: { type: Number, required: true },
 status: { type: Boolean, default: true },
 loop: { type: Boolean, default: false },
});

const PriceListenerModel = model("PriceListener", PriceListenerSchema);

export default PriceListenerModel;
