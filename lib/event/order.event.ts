import event from "events";
import TradeUtils from "../../utils/trades.utils";

const evt = new event.EventEmitter();

enum EventType {
 CANCEL_OPEN_ORDERS = "cancel-open-orders",
}

evt.on(EventType.CANCEL_OPEN_ORDERS, async (symbol: string) => {
 try {
  await TradeUtils.findOrdersAndCancel(symbol);
 } catch (error: any) {
  console.log(error.message);
 }
});

const OrderEvent = { evt, EventType };

export default OrderEvent;
