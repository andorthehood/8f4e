export const createRelativeAddressCalculator = function (offset: number, wordLength: number) {
	return function (nthWord) {
		return nthWord * wordLength + offset * wordLength;
	};
};
