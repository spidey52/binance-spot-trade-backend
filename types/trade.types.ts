export type FutureTrade = {
 symbol: string;
 quantity: number;
 buyPrice: number;
 sellPrice?: number;
 buyTime: Date;
 sellTime?: Date;
};

export type GroupedPendingTrades = {
 symbol: string;
 trades: FutureTrade[];
 avgBuyPrice: number;
 totalQty: number;
 investment: number;
};

export type GroupedCompletedTrades = {
 symbol: string;
 totalQty: number;
 tradeCount: number;
 investment: number;
 sellPrice: number;
 profit: number;
 avgBuyPrice: number;
};
