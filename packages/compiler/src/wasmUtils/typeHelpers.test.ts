import { test, expect } from 'vitest';

import { signedLEB128, unsignedLEB128 } from './typeHelpers';

test('signedLEB128', () => {
	expect(signedLEB128(-10)).toStrictEqual([118]);
	expect(signedLEB128(10)).toStrictEqual([10]);
	expect(signedLEB128(0)).toStrictEqual([0]);
});

test('unsignedLEB128', () => {
	expect(unsignedLEB128(10)).toStrictEqual([10]);
	expect(unsignedLEB128(0)).toStrictEqual([0]);
});
