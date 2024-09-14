import axios from "axios";
import event from "events";
import myenv from "../../config/myenv.config";
import { handleCustomNotification } from "../utils/notificationHandler";

const notificationEvent = new event.EventEmitter();

notificationEvent.on("notification", async ({ title, body }: { title: string; body: string }) => {
 try {
  await handleCustomNotification({ title, body });
  await handleTelegramNotification({ title, body });
 } catch (error: any) {
  console.log(error.message);
 }
});

export const handleTelegramNotification = async ({ title, body }: { title: string; body: string }) => {
 try {
  const url = "https://telegram.spideyworld.co.in/telegram";
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!title.includes(myenv.SERVER_NAME)) {
   title = `${title} | ${myenv.SERVER_NAME}`;
  }

  const message = `${title}\n${body}`;
  await axios.post(url, { chat_id: chatId, message });
  console.log("Telegram notification sent");
 } catch (error: any) {
  console.log(error.message, "from telegram notification");
 }
};

export default notificationEvent;
