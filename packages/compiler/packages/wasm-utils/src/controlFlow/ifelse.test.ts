import { expect, test } from 'vitest';

import ifelse from './ifelse';

import { WASM_TYPE_I32 } from '../type';

test('ifelse generates correct structure', () => {
	const result = ifelse(WASM_TYPE_I32, [65, 1], [65, 0]);
	expect(result).toStrictEqual([4, 127, 65, 1, 5, 65, 0, 11]);
});
