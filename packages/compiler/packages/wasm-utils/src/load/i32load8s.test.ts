import { expect, test } from 'vitest';

import i32load8s from './i32load8s';

test('i32load8s generates correct bytecode', () => {
	expect(i32load8s()).toStrictEqual([44, 0, 0]);
	expect(i32load8s(0, 0, 1)).toStrictEqual([44, 0x40, 1, 0]);
});
