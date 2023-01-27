export const getSellPrice = (value: number, percent: number) => { 
	return value * ((100 + percent) / 100);
}
