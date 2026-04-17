import { expect, test } from 'vitest';

import loop from './loop';

import Type from '../type';

test('loop generates structure with branch back', () => {
	const result = loop(Type.VOID, [65, 1]);
	expect(result).toContain(3);
	expect(result).toContain(12);
	expect(result).toContain(11);
});
