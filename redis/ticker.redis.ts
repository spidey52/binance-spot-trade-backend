import redisClient from "./redis_conn";

export const getTickersList = async () => { 
	const tickers = await redisClient.hGetAll('tickers');

	return tickers;
}