import moment from "moment";
import cron from "node-cron";
import myenv from "../config/myenv.config";
import notificationEvent from "../lib/event/notification.event";
import FutureTradeModel from "../models/future/future.trade.models";

const getProfitSummary = async () => {
 try {
  const today = moment().startOf("day").toDate();
  const todayEnd = moment().endOf("day").toDate();
  const todayProfit = await FutureTradeModel.aggregate([
   {
    $match: { sellTime: { $gte: today, $lte: todayEnd } },
   },

   {
    $group: {
     _id: null,
     profit: {
      $sum: {
       $multiply: [{ $subtract: ["$sellPrice", "$buyPrice"] }, "$quantity"],
      },
     },
    },
   },
  ]);

  const message = `Today's Profit: ${todayProfit[0]?.profit?.toFixed(2) || 0}`;

  notificationEvent.emit("notification", {
   title: `Profit Summary | ${myenv.SERVER_NAME}`,
   body: message,
  });
 } catch (error) {
  return "";
 }
};

const startCron = async () => {
 cron.schedule("0 * * * *", async () => {
  await getProfitSummary();
 });
};

export default startCron;
