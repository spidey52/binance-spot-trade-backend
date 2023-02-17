import axios from "axios";
import { getFcmToken } from "../../redis/redis_conn";

const sendNotification = async (title: string, body: string) => {
 const token = await getFcmToken();
 const message = {
  notification: {
   title,
   body,
  },
  to: token,
 };
 try {
  const { data } = await axios.post("https://fcm.googleapis.com/fcm/send", message, {
   headers: {
    "Content-Type": "application/json",
    Authorization: "key=AAAAuO6zJ1c:APA91bHnt2wq0B3TNYJHDB8Rzual8tx83xToc8GNrUXoQ1jKGVq3b3OOGfc-Jvx1AraMB4bScdtDDUCiC8FmBme6_PgZuTeN25_sCjgjUsXE_etYDelcG5fTVU0k-JtZ3gm5CFQG7XyE",
   },
  });

  return data;
 } catch (error) {
  console.log(error);
  return false;
 }
};

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
 const body = `Buy ${symbol} at ${price}`;
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
 const body = `Sell ${symbol} at ${price} with ${profit} profit`;
 const data = await sendNotification(title, body);
 return data;
};
