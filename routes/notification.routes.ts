import { handleInternalError } from "./../error/error.handler";
import axios from "axios";
import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
 const sendNotification = async () => {
  const token =
   "fqkmD3pWLC01ATSxKmtoM1:APA91bHZS9ZlQDx1CkI1SQ31bt9F-J11Vh0N6w4XQVDr0Igu9IBfFljRdRf-C7z5n99baGxDQYgLH8l4tjtmMmisncb71nSQoHdTN6zxFP7t3plW1D_wIVS2VB7IwA66t80CQT23WCCK";
  await axios("https://fcm.googleapis.com/fcm/send", {
   method: "POST",
   headers: {
    "Content-Type": "application/json",
    Authorization:
     "key=AAAAYIqH8Fk:APA91bGZ4-hubCCHMY2GNbeJ7C8TetJ1BC5KSKBtK7j2LsxrhIvKKlpu-SdZQTKuogpzcBtm0YRVZBgKi31mPoV3pT85IHHuwAD6GczUh1d6LYWGsEvlUFDpUvXDf_VLTuQW_pv0TYyu",
   },
   data: {
    to: token,
    notification: {
     title: req.body.title,
     body: req.body.body,
     sound: "default",
     click_action: "FLUTTER_NOTIFICATION_CLICK",
     icon: "fcm_push_icon",
    },
    data: {
     title: req.body.title,
     body: req.body.body,
     payload: "/create-odometer",
     args: "attendance",
     date: Date.now().toLocaleString(),
    },
   },
  });
 };

 try {
  await sendNotification();
  return res.status(200).send("Notification sent");
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

export default router;
