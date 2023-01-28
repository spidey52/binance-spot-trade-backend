export const getSellPrice = (value: number, percent: number) => { 
	return value * ((100 + percent) / 100);
}

export const getBuyPrice = (value: number, percent: number) => { 
	return value * ((100 - percent) / 100);
}