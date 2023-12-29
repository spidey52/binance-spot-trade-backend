import ccxt from "ccxt";
import dotenv from "dotenv";
dotenv.config();
const apiKey = process.env.API_KEY;
const secret = process.env.API_SECRET;

if (!apiKey || !secret) {
 console.log("No API key or secret found");
 process.exit(1);
}
const exchange = new ccxt.binance({
 apiKey: process.env.API_KEY,
 secret: process.env.API_SECRET,
});

export default exchange;
