import { expect, test } from 'vitest';

import f64store from './f64store';

test('f64store with no setup generates only store instruction', () => {
	const result = f64store();
	expect(result.slice(-3)).toStrictEqual([57, 3, 0]);
	expect(f64store(undefined, undefined, 3, 0, 1)).toStrictEqual([57, 0x43, 1, 0]);
});

test('f64store with address and value generates full instruction sequence', () => {
	const result = f64store(0, 1.0);
	expect(result).toContain(57);
});
