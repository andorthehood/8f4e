import { expect, test } from 'vitest';

import i32load from './i32load';

test('i32load generates correct bytecode', () => {
	expect(i32load()).toStrictEqual([40, 2, 0]);
	expect(i32load(3, 8)).toStrictEqual([40, 3, 8]);
	expect(i32load(2, 0, 1)).toStrictEqual([40, 0x42, 1, 0]);
});
