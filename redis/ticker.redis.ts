import redisClient from "./redis_conn";


export const getTickersList = async () => { 
	const tickers = await redisClient.hGetAll('tickers');

	return tickers;
}

const tickerLoopPercentKey  = (symbol: string) => `tickerLoopPercent#${symbol}`;

export const getTickerPercent = async (symbol: string) => { 
	const tickerPercent = await redisClient.get(symbol);
	return tickerPercent ? tickerPercent : 2;
}

export const setTickerPercent = async (symbol: string, percent: number) => { 
	await redisClient.set(symbol, percent);
}

export const getTicker = async () => { 
	const keys = await redisClient.keys('tickerLoopPercent#*');
	console.log(keys);
	return keys;
}

export const getTickerLoopPercent = async (symbol: string) => { 
	const tickerLoopPercent = await redisClient.get(tickerLoopPercentKey(symbol));
	if(!tickerLoopPercent) await redisClient.set(tickerLoopPercentKey(symbol), 2 );
	return tickerLoopPercent ? tickerLoopPercent : 2;
}

export const setTickerLoopPercent = async (symbol: string, percent: number) => { 
	await redisClient.set(tickerLoopPercentKey(symbol), percent);
}


