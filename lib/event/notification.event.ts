import event from "events";
import { handleCustomNotification } from "../utils/notificationHandler";

const notificationEvent = new event.EventEmitter();

notificationEvent.on("notification", async ({ title, body }: { title: string; body: string }) => {
 try {
  await handleCustomNotification({ title, body });
 } catch (error: any) {
  console.log(error.message);
 }
});

export default notificationEvent;
