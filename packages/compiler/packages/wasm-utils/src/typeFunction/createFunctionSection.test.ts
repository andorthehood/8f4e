import { expect, test } from 'vitest';

import createFunctionSection from './createFunctionSection';

test('createFunctionSection generates correct section', () => {
	expect(createFunctionSection([0])).toStrictEqual([3, 2, 1, 0]);
	expect(createFunctionSection([0, 1, 2])).toStrictEqual([3, 4, 3, 0, 1, 2]);
});
