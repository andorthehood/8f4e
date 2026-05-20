import { expect, test } from 'vitest';

import memarg from './memarg';

test('memarg keeps the default memory encoding unchanged', () => {
	expect(memarg(2, 0)).toStrictEqual([2, 0]);
	expect(memarg(0, 16)).toStrictEqual([0, 16]);
});

test('memarg encodes multi-memory immediates for non-default memories', () => {
	expect(memarg(2, 0, 1)).toStrictEqual([0x42, 1, 0]);
	expect(memarg(0, 16, 2)).toStrictEqual([0x40, 2, 16]);
});
