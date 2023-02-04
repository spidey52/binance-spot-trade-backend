import TickerModel from "../../models/ticker.models";

export const getSellPrice = (value: number, percent: number) => {
 return value * ((100 + percent) / 100);
};

export const getBuyPrice = (value: number, percent: number) => {
 return value * ((100 - percent) / 100);
};

export const getPrecision = async (symbol: string) => {
 const ticker = await TickerModel.findOne({ symbol });
 if (!ticker) {
  const newTicker = await TickerModel.create({ symbol, precision: 4 });
  return 4;
 }

 return ticker.precision || 4;
};
