import ccxt from "ccxt";
import FutureTickerModel from "../../models/future/future.ticker.models";

export const futureExchange = new ccxt.binance({
 apiKey: process.env.FUTURE_API_KEY,
 secret: process.env.FUTURE_API_SECRET,
 options: {
  defaultType: "future",
 },
});

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

export const syncOpenOrder = async () => {
 const tickers = await FutureTickerModel.find();

 for (let i = 0; i < tickers.length; i++) {
  const orders = await futureExchange.fetchOpenOrders(tickers[i].symbol);

  OPEN_ORDERS[tickers[i].symbol] = orders.map((order: any) => {
   return {
    symbol: order.symbol,
    orderId: order.id,
    price: order.price,
    side: order.side,
   };
  });
 }
};

// syncOpenOrder();
