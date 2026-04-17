import { expect, test } from 'vitest';

import createMemoryImport from './createMemoryImport';

import { ImportDesc } from '../section';

test('createMemoryImport generates correct entry', () => {
	const imp = createMemoryImport('js', 'memory', 1);
	expect(imp).toContain(ImportDesc.MEMORY);
});

test('createMemoryImport handles shared memory', () => {
	const imp = createMemoryImport('js', 'memory', 1, 10, true);
	expect(imp).toContain(0x03);
});
