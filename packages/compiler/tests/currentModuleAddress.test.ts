import { describe, expect, test } from 'vitest';

import compile from '../src';

describe('current-module address shorthands', () => {
	test('resolves current-module start-address shorthand (&this)', () => {
		const modules = [{ code: ['module sourceModule', 'int* ptr &this', 'moduleEnd'] }];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
		});

		const sourceModule = result.compiledModules['sourceModule'];

		expect(sourceModule.memoryMap['ptr'].default).toBe(sourceModule.byteAddress);
	});

	test('resolves current-module end-address shorthand (this&)', () => {
		const modules = [{ code: ['module sourceModule', 'int[] buffer 10 0', 'int* ptr this&', 'moduleEnd'] }];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
		});

		const sourceModule = result.compiledModules['sourceModule'];

		expect(sourceModule.memoryMap['ptr'].default).toBe(sourceModule.byteAddress + (sourceModule.wordAlignedSize - 1) * 4);
	});
});
