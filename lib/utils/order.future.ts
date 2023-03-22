type order = {
 symbol: string;
 orderId: string;
 price: number;
 side: string;
};
export const OPEN_ORDERS: {
 [key: string]: order[];
} = {};

export const addOpenOrder = (symbol: string, orderId: string, price: number, side: string) => {
 let obj = {
  symbol,
  orderId,
  price,
  side,
 };
 if (OPEN_ORDERS[symbol]) OPEN_ORDERS[symbol].push(obj);
 else OPEN_ORDERS[symbol] = [obj];
};
export const deleteOpenOrder = (symbol: string, orderId: string) => {
 if (OPEN_ORDERS[symbol]) {
  OPEN_ORDERS[symbol] = OPEN_ORDERS[symbol].filter((order) => order.orderId !== orderId);
 }
};
export const findPendingOrder = (symbol: string, price: number) => {
 if (OPEN_ORDERS[symbol]) {
  return OPEN_ORDERS[symbol].find((order) => {
   if (order.side.toLowerCase() === "buy" && Number(order.price).toFixed(2) === Number(price).toFixed(2)) return true;
   return false;
  });
 }
};
