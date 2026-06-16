import { describe, expect, it } from 'vitest';

import compileProjectModules from '../src/compile/compileProjectModules';

describe('compileProjectModules', () => {
	it('resolves nth references across project file order', async () => {
		const result = await compileProjectModules(
			[
				{
					id: 1,
					code: ['module target', '; @pos -71 -28', 'int* ptr &source:0', 'moduleEnd'],
					entry: 'main',
				},
				{
					id: 2,
					code: ['module source', '; @pos -141 -28', 'int value 0', 'moduleEnd'],
					entry: 'main',
				},
			],
			{
				compilerOptions: { startingMemoryWordAddress: 0 },
				includeWasm: false,
			}
		);

		expect(result.compiledModules?.target.index).toBe(0);
		expect(result.compiledModules?.source.index).toBe(1);
		expect(result.compiledModules?.target.memoryDefaults.ptr.value).toBe(
			result.compiledModules?.source.memory.value.byteAddress
		);
	});

	it('preserves file order when module blocks are already ordered', async () => {
		const result = await compileProjectModules(
			[
				{
					id: 1,
					code: ['module source', '; @pos -141 -28', 'int value 0', 'moduleEnd'],
					entry: 'main',
				},
				{
					id: 2,
					code: ['module target', '; @pos -71 -28', 'int* ptr &source:0', 'moduleEnd'],
					entry: 'main',
				},
			],
			{
				compilerOptions: { startingMemoryWordAddress: 0 },
				includeWasm: false,
			}
		);

		expect(result.compiledModules?.source.index).toBe(0);
		expect(result.compiledModules?.target.index).toBe(1);
		expect(result.compiledModules?.target.memoryDefaults.ptr.value).toBe(
			result.compiledModules?.source.memory.value.byteAddress
		);
	});

	it('preserves explicit execution entries on compiled modules', async () => {
		const result = await compileProjectModules(
			[
				{
					id: 1,
					code: ['module addWorks', 'push 1', 'drop', 'moduleEnd'],
					entry: 'test',
				},
			],
			{
				compilerOptions: { startingMemoryWordAddress: 0 },
				includeWasm: false,
			}
		);

		expect(result.compiledModules?.addWorks.executionEntryName).toBe('test');
	});

	it('compiles test dependencies as ordinary blocks', async () => {
		const result = await compileProjectModules(
			[
				{
					id: 1,
					code: ['module target', 'int* ptr &dependency:value', 'push *ptr', 'drop', 'moduleEnd'],
					entry: 'test',
				},
				{
					id: 2,
					code: ['module dependency', 'int value 42', 'moduleEnd'],
					entry: 'main',
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

	it('compiles included functions resolved from includes blocks with parsed project modules', async () => {
		const result = await compileProjectModules(
			[
				{
					id: 1,
					code: ['includes', 'include std/test/includedOne', 'includesEnd'],
				},
				{
					id: 2,
					code: ['module target', 'call includedOne', 'drop', 'moduleEnd'],
					entry: 'main',
				},
			],
			{
				compilerOptions: { startingMemoryWordAddress: 0 },
				includeWasm: false,
				resolveInclude: includeId =>
					includeId === 'std/test/includedOne'
						? ['function includedOne', 'push 1', 'functionEnd int'].join('\n')
						: undefined,
			}
		);

		expect(result.compiledModules?.target).toBeDefined();
	});
});
