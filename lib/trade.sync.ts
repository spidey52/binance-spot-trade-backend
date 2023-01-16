import ccxt from 'ccxt'
import TickerModel from '../models/ticker.models'
import TradeModel from '../models/trades.models'

const exchange = new ccxt.binance({
	apiKey: process.env.API_KEY,
	secret: process.env.API_SECRET,
})

const getTrades = async (symbol: string) => {
	const trades = await exchange.fetchMyTrades(symbol)
	return trades
}

const tradeSync = async () => {
	const tickers = await TickerModel.find({})
	const symbols = tickers.map(ticker => ticker.symbol)
	for (let i = 0; i < symbols.length; i++) {
		const lastTrades = await TradeModel.find({ symbol: symbols[i] }).sort({ createdAt: -1 }).limit(1)
		const lastTrade = lastTrades.length === 0 ? Date.now() - 1000 * 60 * 60 * 24 * 365 * 5 : new Date(lastTrades[0].createdAt).getTime();

		const trades = (await getTrades(symbols[i])).filter(trade => new Date(trade.timestamp).getTime() > lastTrade).filter(trade => trade.side === 'buy')
		for (let j = 0; j < trades.length; j++) {
			const trade = trades[j].info
			const newTradeBody = {
				buyPrice: trade.price,
				quantity: trade.qty,
				symbol: trade.symbol,
				user: '63beffd81c1312d53375a43f'
			}
			await TradeModel.create(newTradeBody);
		}
	}
}


export default tradeSync