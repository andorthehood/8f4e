import { expect, test } from 'vitest';

import loop from './loop';

import { WASM_TYPE_VOID } from '../type';

test('loop generates structure with branch back', () => {
	const result = loop(WASM_TYPE_VOID, [65, 1]);
	expect(result).toContain(3);
	expect(result).toContain(12);
	expect(result).toContain(11);
});
