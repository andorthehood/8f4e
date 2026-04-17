import { expect, test } from 'vitest';

import createLocalDeclaration from './createLocalDeclaration';

import Type from '../type';

test('createLocalDeclaration generates correct format', () => {
	const decl = createLocalDeclaration(Type.I32, 2);
	expect(decl).toStrictEqual([2, Type.I32]);
});
