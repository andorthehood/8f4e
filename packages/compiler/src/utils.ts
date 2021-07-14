import { RelativeAddressCalculator } from './types';

export function createRelativeAddressCalculator(offset: number, wordLength: number): RelativeAddressCalculator {
	return {
		byte: function (nthWord) {
			return nthWord * wordLength + offset * wordLength;
		},
		word: function (nthWord) {
			return nthWord + offset;
		},
	};
}
