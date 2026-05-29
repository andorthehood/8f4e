import { describe, expect, it } from 'vitest';

import compileProjectModules from '../src/compile/compileProjectModules';

describe('compileProjectModules', () => {
	it('compiles module blocks in project file order', () => {
		expect(() =>
			compileProjectModules(
				[
					{
						code: ['module target', '; @pos -71 -28', 'int* ptr &source:0', 'moduleEnd'],
					},
					{
						code: ['module source', '; @pos -141 -28', 'int value 0', 'moduleEnd'],
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
				},
				{
					code: ['module target', '; @pos -71 -28', 'int* ptr &source:0', 'moduleEnd'],
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

	it('returns test module ids reported by parsed compiler metadata', () => {
		const result = compileProjectModules(
			[
				{
					code: ['module addWorks', '#test ; inline comment', 'push 1', 'assert 1', 'moduleEnd'],
				},
			],
			{
				compilerOptions: { includeTestRunner: true, startingMemoryWordAddress: 0 },
				includeWasm: false,
			}
		);

		expect(result.testModuleIds).toEqual(['addWorks']);
	});
});
