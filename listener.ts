import WebSocket from "ws";

const socket = new WebSocket("wss://stream.binance.com:9443/ws/!miniTicker@arr");

socket.addEventListener("open", () => {
 console.log("Connected to server");
});

socket.addEventListener("message", (event) => {
 console.log(event.data.toString());
 console.log(JSON.parse(event.data.toString()));
});

socket.addEventListener("close", () => {
 console.log("connection closed");
});
