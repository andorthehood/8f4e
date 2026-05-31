import { expect, test } from 'vitest';
import { ImportDesc } from '../section';
import createMemoryImport from './createMemoryImport';

test('createMemoryImport generates correct entry', () => {
	const imp = createMemoryImport('host', 'memory', 1);
	expect(imp).toContain(ImportDesc.MEMORY);
});

test('createMemoryImport handles shared memory', () => {
	const imp = createMemoryImport('host', 'memory', 1, 10, true);
	expect(imp).toContain(0x03);
});

test('createMemoryImport handles maximum memory', () => {
	const imp = createMemoryImport('host', 'memory', 1, 10);
	expect(imp).toContain(0x01);
	expect(imp.slice(-2)).toStrictEqual([1, 10]);
});
