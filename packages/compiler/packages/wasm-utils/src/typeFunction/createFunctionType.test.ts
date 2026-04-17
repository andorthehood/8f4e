import { expect, test } from 'vitest';

import createFunctionType from './createFunctionType';

import Type from '../type';

test('createFunctionType generates correct signature', () => {
	const funcType = createFunctionType([Type.I32, Type.I32], [Type.I32]);
	expect(funcType).toStrictEqual([0x60, 2, Type.I32, Type.I32, 1, Type.I32]);
});
