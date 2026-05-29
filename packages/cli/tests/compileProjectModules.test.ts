import { describe, expect, it } from 'vitest';

import compileProjectModules from '../src/compile/compileProjectModules';

describe('compileProjectModules', () => {
	it('compiles module blocks in project file order', () => {
		expect(() =>
			compileProjectModules(
				[
					{
						code: ['module target', '; @pos -71 -28', 'int* ptr &source:0', 'moduleEnd'],
						executionGroupName: 'main',
					},
					{
						code: ['module source', '; @pos -141 -28', 'int value 0', 'moduleEnd'],
						executionGroupName: 'main',
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
					executionGroupName: 'main',
				},
				{
					code: ['module target', '; @pos -71 -28', 'int* ptr &source:0', 'moduleEnd'],
					executionGroupName: 'main',
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

	it('preserves explicit execution groups on compiled modules', () => {
		const result = compileProjectModules(
			[
				{
					code: ['module addWorks', 'push 1', 'assert 1', 'moduleEnd'],
					executionGroupName: 'test',
				},
			],
			{
				compilerOptions: { startingMemoryWordAddress: 0 },
				includeWasm: false,
			}
		);

		expect(result.compiledModules?.addWorks.executionGroupName).toBe('test');
	});

	it('compiles test dependencies as ordinary blocks', () => {
		const result = compileProjectModules(
			[
				{
					code: ['module target', 'int* ptr &dependency:value', 'push *ptr', 'assert 42', 'moduleEnd'],
					executionGroupName: 'test',
				},
				{
					code: ['module dependency', 'int value 42', 'moduleEnd'],
					executionGroupName: 'main',
				},
			],
			{
				compilerOptions: { startingMemoryWordAddress: 0 },
				includeWasm: false,
			}
		);

		expect(result.assertions).toEqual([
			expect.objectContaining({
				moduleId: 'target',
				expected: 42,
			}),
		]);
	});
});
