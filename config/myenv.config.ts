import { randomBytes } from "crypto";
import dotenv from "dotenv";

dotenv.config();

const myenv = {
 SERVER_NAME: process.env.SERVER_NAME || randomBytes(4).toString("hex"),
 DB_URI: process.env.MONGO_URI || "mongodb://localhost:27017/algotrade",

 isDevMode: process.env.NODE_ENV === "development",
 isProdMode: process.env.NODE_ENV === "production",
};

export default myenv;
