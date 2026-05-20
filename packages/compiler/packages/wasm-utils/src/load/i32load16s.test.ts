import { expect, test } from 'vitest';

import i32load16s from './i32load16s';

test('i32load16s generates correct bytecode', () => {
	expect(i32load16s()).toStrictEqual([46, 1, 0]);
	expect(i32load16s(1, 0, 1)).toStrictEqual([46, 0x41, 1, 0]);
});
