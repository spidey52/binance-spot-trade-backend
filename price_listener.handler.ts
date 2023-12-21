import event from "events";
import notificationEvent from "./lib/event/notification.event";
import PriceListenerModel, { IPriceListener } from "./models/future/price.listener.models";
import TickerModel from "./models/ticker.models";

const priceListenerEmitter = new event.EventEmitter();

priceListenerEmitter.on("TICKER_EDIT", async ({ listener }: { listener: IPriceListener }) => {
 try {
  const { _id: listenerId, symbol, payload } = listener;

  await PriceListenerModel.findByIdAndUpdate(listenerId, { active: false });
  await TickerModel.findOneAndUpdate({ symbol }, payload);

  notificationEvent.emit("notification", { title: "Ticker Updated", body: `Ticker ${symbol} updated successfully using price listener` });
 } catch (error: any) {
  console.log(error.message);
 }
});

const handlePriceListener = async (obj: { [key: string]: number } = {}) => {
 const activeListners = await PriceListenerModel.find({ active: true }).lean();

 for (let listener of activeListners) {
  // fetching current price from stream
  const currentPrice = obj[listener.symbol];
  if (!currentPrice) continue;

  const triggerPrice = listener.price;

  if (listener.event === "TICKER_EDIT") {
   const expression = listener.expression;

   // if expression is GTE and current price is greater than or equal to trigger price or expression is LTE and current price is less than or equal to trigger price
   if ((expression === "GTE" && currentPrice >= triggerPrice) || (expression === "LTE" && currentPrice <= triggerPrice)) {
    priceListenerEmitter.emit("TICKER_EDIT", { listener });
   }
  }

  // end of for loop
 }
};

export default handlePriceListener;
