import { expect, test } from 'vitest';

import createLocalDeclaration from './createLocalDeclaration';

import { WASM_TYPE_I32 } from '../type';

test('createLocalDeclaration generates correct format', () => {
	const decl = createLocalDeclaration(WASM_TYPE_I32, 2);
	expect(decl).toStrictEqual([2, WASM_TYPE_I32]);
});
