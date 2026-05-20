import { expect, test } from 'vitest';

import i32load16u from './i32load16u';

test('i32load16u generates correct bytecode', () => {
	expect(i32load16u()).toStrictEqual([47, 1, 0]);
	expect(i32load16u(1, 0, 1)).toStrictEqual([47, 0x41, 1, 0]);
});
