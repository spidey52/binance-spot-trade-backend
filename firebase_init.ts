import dotenv from "dotenv";
import { google } from "googleapis";
import axios from "axios";
import redisClient from "./redis/redis_conn";

dotenv.config();


// cloud messaging scopes
const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

const servicefile = process.env.FIREBASE_SERVICE_ACCOUNT;


async function getAccessToken() {
 if (!servicefile) {
  console.log("FIREBASE_SERVICE_ACCOUNT env variables not set");
  process.exit(1);
 }

 const token = await redisClient.get("firebase_token");

 if (token) {
  console.log("token from redis", token);
  return token;
 }

 return new Promise((resolve, reject) => {
  const key = require(servicefile);
  const jwtClient = new google.auth.JWT(key.client_email, undefined, key.private_key, SCOPES, undefined);
  jwtClient.authorize((err, tokens) => {
   if (err) {
    reject(err);
    return;
   }
   if (tokens?.access_token) redisClient.set("firebase_token", tokens.access_token);
   resolve(tokens?.access_token);
  });
 });
}

const sendFirebaseNotifcation = async (tokens: string[], title: string, body: string, data: any) => {
 const accessToken = await getAccessToken();
 const message = {
  token: tokens.join(","),
  notification: {
   title,
   body,
  },
  data: {
   test: "test",
  },
 };

 const url = "https://fcm.googleapis.com/v1/projects/algo-trade-dcceb/messages:send"

 if (!url) {
  console.log("FIREBASE_CLOUD_MESSAGING_URL env variables not set");
  process.exit(1);
 }

 const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${accessToken}`,
 };

 try {
  const response = await axios.post(url, { message }, { headers });
  console.log(response.data);
 } catch (error: any) {
  if (error.response.status == 401) {
   redisClient.del("firebase_token");
   sendFirebaseNotifcation(tokens, title, body, data);
   return;
  }
  console.log(error.message, error.response.data);
 }
};

export default sendFirebaseNotifcation
