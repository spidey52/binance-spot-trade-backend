import { createClient } from "redis";

const redisClient = createClient({})

redisClient.on("error", (err) => {
	console.log("Error " + err.message);
})

redisClient.on("connect", () => {
	console.log("Connected to Redis");
})


export default redisClient;


