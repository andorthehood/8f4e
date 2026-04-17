import { expect, test } from 'vitest';

import ifelse from './ifelse';

import Type from '../type';

test('ifelse generates correct structure', () => {
	const result = ifelse(Type.I32, [65, 1], [65, 0]);
	expect(result).toStrictEqual([4, 127, 65, 1, 5, 65, 0, 11]);
});
