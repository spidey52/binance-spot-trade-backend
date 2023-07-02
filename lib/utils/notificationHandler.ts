import axios from "axios";
import { getFcmToken } from "../../redis/redis_conn";
import sendFirebaseNotification from "../../firebase_init";

const sendNotification = async (title: string, body: string) => {
 const token = await getFcmToken();
 if (!token) return;
 const message = {
  notification: {
   title,
   body,
  },
  to: token,
 };
 try {
  let token = "dc8uFLvqRpyFbLrdtjNHpk:APA91bFzUuONY8mLHGRyNzT0L5dN1sNdi63ycOUJyyKuna2ROIQ3mNBq5XkQx4XMT1LH8hfbTyWQEo05yTlAwzMi0QzWLkfnBKybtawXdLIiSL497XQE1xlKK1D8BpBUDA9R2zgTCfSV";
  await sendFirebaseNotification([token], title, body, {});
 } catch (error) {
  console.log(error);
  return false;
 }
};

sendNotification("hello", "workd");

type BuyNotification = {
 symbol: string;
 price: number;
};

export const handleCustomNotification = async ({ title, body }: { title: string; body: string }) => {
 const data = await sendNotification(title, body);
 return data;
};

export const handleBuyNotification = async ({ symbol, price }: BuyNotification) => {
 const title = "Buy Notification";
 const body = `Buy ${symbol} at ${parseFloat(price.toString()).toFixed(2)}`;
 const data = await sendNotification(title, body);
 return data;
};

type SellNotification = {
 symbol: string;
 price: number;
 profit: number;
};

export const handleSellNotification = async ({ symbol, price, profit }: SellNotification) => {
 const title = "Sell Notification";
 const body = `Sell ${symbol} at ${parseFloat(price.toString())} with ${parseFloat(profit.toString()).toFixed(2)} profit`;
 const data = await sendNotification(title, body);
 return data;
};
