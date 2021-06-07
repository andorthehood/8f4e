import { RelativeAddressCalculator } from './types';

export function createRelativeAddressCalculator(offset: number, wordLength: number): RelativeAddressCalculator {
	return function (nthWord) {
		return nthWord * wordLength + offset * wordLength;
	};
}
