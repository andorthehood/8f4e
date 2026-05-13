import { expect, test } from 'vitest';

import createFunctionType from './createFunctionType';

import { WASM_TYPE_I32 } from '../type';

test('createFunctionType generates correct signature', () => {
	const funcType = createFunctionType([WASM_TYPE_I32, WASM_TYPE_I32], [WASM_TYPE_I32]);
	expect(funcType).toStrictEqual([0x60, 2, WASM_TYPE_I32, WASM_TYPE_I32, 1, WASM_TYPE_I32]);
});
