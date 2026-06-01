import { describe, expect, it } from 'vitest';

import compileProjectModules from '../src/compile/compileProjectModules';

describe('compileProjectModules', () => {
	it('compiles module blocks in project file order', () => {
		expect(() =>
			compileProjectModules(
				[
					{
						code: ['module target', '; @pos -71 -28', 'int* ptr &source:0', 'moduleEnd'],
						entry: 'main',
						containsShape: false,
					},
					{
						code: ['module source', '; @pos -141 -28', 'int value 0', 'moduleEnd'],
						entry: 'main',
						containsShape: false,
					},
				],
				{
					compilerOptions: { startingMemoryWordAddress: 0 },
					includeWasm: false,
				}
			)
		).toThrow('Undeclared identifier: &source:0.');
	});

	it('preserves file order when module blocks are already ordered', () => {
		const result = compileProjectModules(
			[
				{
					code: ['module source', '; @pos -141 -28', 'int value 0', 'moduleEnd'],
					entry: 'main',
					containsShape: false,
				},
				{
					code: ['module target', '; @pos -71 -28', 'int* ptr &source:0', 'moduleEnd'],
					entry: 'main',
					containsShape: false,
				},
			],
			{
				compilerOptions: { startingMemoryWordAddress: 0 },
				includeWasm: false,
			}
		);

		expect(result.compiledModules?.source.index).toBe(0);
		expect(result.compiledModules?.target.index).toBe(1);
		expect(result.compiledModules?.target.memoryMap.ptr.default).toBe(
			result.compiledModules?.source.memoryMap.value.byteAddress
		);
	});

	it('preserves explicit execution entries on compiled modules', () => {
		const result = compileProjectModules(
			[
				{
					code: ['module addWorks', 'push 1', 'drop', 'moduleEnd'],
					entry: 'test',
					containsShape: false,
				},
			],
			{
				compilerOptions: { startingMemoryWordAddress: 0 },
				includeWasm: false,
			}
		);

		expect(result.compiledModules?.addWorks.executionEntryName).toBe('test');
	});

	it('compiles test dependencies as ordinary blocks', () => {
		const result = compileProjectModules(
			[
				{
					code: ['module target', 'int* ptr &dependency:value', 'push *ptr', 'drop', 'moduleEnd'],
					entry: 'test',
					containsShape: false,
				},
				{
					code: ['module dependency', 'int value 42', 'moduleEnd'],
					entry: 'main',
					containsShape: false,
				},
			],
			{
				compilerOptions: { startingMemoryWordAddress: 0 },
				includeWasm: false,
			}
		);

		expect(result.compiledModules?.target.executionEntryName).toBe('test');
		expect(result.compiledModules?.dependency.executionEntryName).toBe('main');
	});
});
