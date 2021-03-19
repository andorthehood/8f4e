import { RelativeAddressCalculator } from './types';

export const createRelativeAddressCalculator = function (
	offset: number,
	wordLength: number
): RelativeAddressCalculator {
	return function (nthWord) {
		return nthWord * wordLength + offset * wordLength;
	};
};
