import { handleInternalError } from "./../error/error.handler";
import axios from "axios";
import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
 const sendNotification = async () => {};

 try {
  await sendNotification();
  return res.status(200).send("Notification sent");
 } catch (error) {
  handleInternalError(req, res, error);
 }
});

export default router;
