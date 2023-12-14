export const kPendingTradesFilter = { sellTime: { $exists: false } };
export const kCalculateInvestment = { $multiply: ["$buyPrice", "$quantity"] };
