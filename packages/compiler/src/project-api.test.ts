import type { ProjectGroupObjectModel, ProjectObjectModel } from '@8f4e/language-spec';
import { ErrorCode, WASM_MEMORY_PAGE_SIZE } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { compileProject, parseProjectSource } from '.';

const source = [
	'8f4e/v1',
	'',
	'function one',
	'push 1',
	'functionEnd int',
	'',
	'entry main',
	'module counter',
	'int value 2',
	'push value',
	'call one',
	'add',
	'drop',
	'moduleEnd',
	'entryEnd',
].join('\n');

const directProject: ProjectObjectModel = {
	modules: [
		{
			id: 8,
			entry: 'main',
			code: ['module counter', 'int value 2', 'push value', 'call one', 'add', 'drop', 'moduleEnd'],
		},
	],
	functions: [{ id: 3, code: ['function one', 'push 1', 'functionEnd int'] }],
	constants: [],
	prototypes: [],
	includes: [],
	notes: [],
	unknown: [],
	groups: [],
};

const relocatedProject: ProjectObjectModel = {
	...directProject,
	functions: [],
	modules: [
		{
			id: 1,
			entry: 'main',
			code: ['module relocated', 'int input 7', 'int output', 'push &output', 'push input', 'store', 'moduleEnd'],
		},
	],
};

describe('project compiler API', () => {
	it('parses text into the canonical project collections', () => {
		expect(parseProjectSource(source)).toEqual(directProject);
	});

	it('compiles directly from an object without a text round trip', async () => {
		const result = await compileProject(directProject, { disableSharedMemory: true });
		expect(result.compiledModules.counter).toBeDefined();
		expect(Object.values(result.compiledFunctions ?? {}).some(func => func.name === 'one')).toBe(true);
	});

	it('produces equivalent output for parsed and directly constructed projects', async () => {
		const [parsedResult, directResult] = await Promise.all([
			compileProject(parseProjectSource(source), { disableSharedMemory: true }),
			compileProject(directProject, { disableSharedMemory: true }),
		]);
		expect(new Uint8Array(parsedResult.codeBuffer)).toEqual(new Uint8Array(directResult.codeBuffer));
		expect(parsedResult.memoryPlan).toEqual(directResult.memoryPlan);
	});

	it('applies the configured starting memory word address to planned and emitted module memory', async () => {
		const [defaultResult, zeroResult, relocatedResult] = await Promise.all([
			compileProject(relocatedProject, { disableSharedMemory: true }),
			compileProject(relocatedProject, { disableSharedMemory: true, startingMemoryWordAddress: 0 }),
			compileProject(relocatedProject, { disableSharedMemory: true, startingMemoryWordAddress: 8 }),
		]);

		expect(defaultResult.memoryPlan.modules.relocated.byteAddress).toBe(4);
		expect(zeroResult.memoryPlan.modules.relocated.byteAddress).toBe(0);
		expect(relocatedResult.memoryPlan.modules.relocated.byteAddress).toBe(32);
		expect(relocatedResult.memoryPlan.modules.relocated.memory.input.byteAddress).toBe(32);
		expect(relocatedResult.memoryPlan.modules.relocated.memory.output.byteAddress).toBe(36);
		expect(relocatedResult.requiredMemoryBytes).toBe(40);

		const memory = new WebAssembly.Memory({
			initial: Math.ceil(relocatedResult.requiredMemoryBytes / WASM_MEMORY_PAGE_SIZE),
			maximum: Math.ceil(relocatedResult.requiredMemoryBytes / WASM_MEMORY_PAGE_SIZE),
		});
		const { instance } = await WebAssembly.instantiate(relocatedResult.codeBuffer, { host: { memory } });
		(instance.exports.initDefaults as CallableFunction)();
		(instance.exports.main as CallableFunction)();

		expect(new Int32Array(memory.buffer)[9]).toBe(7);
	});

	it('composes recursively owned group blocks before root blocks', async () => {
		const grouped = parseProjectSource(
			[
				'8f4e/v1',
				'entry main',
				'module root',
				'moduleEnd',
				'group audio',
				'module grouped',
				'int value 1',
				'moduleEnd',
				'groupEnd',
				'entryEnd',
			].join('\n')
		);
		expect(grouped.groups).toEqual([
			{
				name: 'audio',
				entry: 'main',
				code: ['group audio', 'groupEnd'],
				exposures: [],
				modules: [{ id: 6, entry: 'main', code: ['module grouped', 'int value 1', 'moduleEnd'] }],
				functions: [],
				constants: [],
				prototypes: [],
				includes: [],
				notes: [],
				unknown: [],
				groups: [],
			},
		]);
		const result = await compileProject(grouped, { disableSharedMemory: true });
		const compiledModules = Object.values(result.compiledModules).sort((left, right) => left.index - right.index);
		expect(compiledModules).toMatchObject([
			{ ast: { projectBlockId: 6 }, executionEntryName: 'main' },
			{ id: 'root', executionEntryName: 'main' },
		]);
		expect(compiledModules[0]?.id).toBe('audio/grouped');
		expect(result.compiledModules['audio/grouped']).toBe(compiledModules[0]);
		expect(result.memoryPlan.modules['audio/grouped']).toBeDefined();
		expect(result.memoryDefaultsByModuleId['audio/grouped']).toBeDefined();
		expect(result.pointerMetadataByModuleId['audio/grouped']).toBeDefined();
	});

	it('isolates same-named functions in sibling groups and executes both groups', async () => {
		const createGroup = (name: string, firstId: number, value: number): ProjectGroupObjectModel => ({
			...directProject,
			name,
			entry: 'main',
			code: [`group ${name}`, 'groupEnd'],
			exposures: [],
			modules: [
				{
					id: firstId + 1,
					entry: 'main',
					code: ['module shared', 'int output', 'push &output', 'call value', 'store', 'moduleEnd'],
				},
			],
			functions: [{ id: firstId, code: ['function value', `push ${value}`, 'functionEnd int'] }],
			groups: [],
		});
		const result = await compileProject(
			{
				...directProject,
				modules: [],
				functions: [],
				groups: [createGroup('left', 10, 7), createGroup('right', 20, 11)],
			},
			{ disableSharedMemory: true }
		);
		const modules = Object.values(result.compiledModules).sort((left, right) => left.index - right.index);
		const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
		const { instance } = await WebAssembly.instantiate(result.codeBuffer, { host: { memory } });
		(instance.exports.initDefaults as CallableFunction)();
		(instance.exports.main as CallableFunction)();

		expect(modules).toHaveLength(2);
		expect(modules.map(module => module.id)).toEqual(['left/shared', 'right/shared']);
		expect(new Int32Array(memory.buffer)[result.memoryPlan.modules[modules[0]!.id]!.byteAddress / 4]).toBe(7);
		expect(new Int32Array(memory.buffer)[result.memoryPlan.modules[modules[1]!.id]!.byteAddress / 4]).toBe(11);
	});

	it('resolves and scopes includes owned by nested groups', async () => {
		const result = await compileProject(
			{
				...directProject,
				modules: [],
				functions: [],
				groups: [
					{
						...directProject,
						name: 'included',
						entry: 'main',
						code: ['group included', 'groupEnd'],
						exposures: [],
						modules: [
							{
								id: 11,
								entry: 'main',
								code: ['module included', 'int output', 'push &output', 'call includedValue', 'store', 'moduleEnd'],
							},
						],
						functions: [],
						includes: [{ id: 12, code: ['includes', 'include nested-helper', 'includesEnd'] }],
						groups: [],
					},
				],
			},
			{
				disableSharedMemory: true,
				resolveInclude: includeId =>
					includeId === 'nested-helper'
						? ['function helper', '#export includedValue', 'push 13', 'functionEnd int'].join('\n')
						: undefined,
			}
		);
		const module = Object.values(result.compiledModules)[0]!;
		const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
		const { instance } = await WebAssembly.instantiate(result.codeBuffer, { host: { memory } });
		(instance.exports.initDefaults as CallableFunction)();
		(instance.exports.main as CallableFunction)();

		expect(new Int32Array(memory.buffer)[result.memoryPlan.modules[module.id]!.byteAddress / 4]).toBe(13);
	});

	it('does not expose nested functions to the root project namespace', async () => {
		const compilation = compileProject(
			{
				...directProject,
				modules: [{ id: 1, entry: 'main', code: ['module root', 'call hidden', 'moduleEnd'] }],
				functions: [],
				groups: [
					{
						...directProject,
						name: 'hidden',
						entry: 'main',
						code: ['group hidden', 'groupEnd'],
						exposures: [],
						modules: [],
						functions: [{ id: 2, code: ['function hidden', 'functionEnd'] }],
						groups: [],
					},
				],
			},
			{ disableSharedMemory: true }
		);

		await expect(compilation).rejects.toMatchObject({ code: ErrorCode.UNDEFINED_FUNCTION });
	});

	it('resolves group memory exposures without allocating alias memory', async () => {
		const project = parseProjectSource(
			[
				'8f4e/v1',
				'entry main',
				'module root',
				'int* groupedValue &audio:exposedValue',
				'int observed',
				'push &observed',
				'push *groupedValue',
				'store',
				'moduleEnd',
				'group audio',
				'expose int exposedValue &source:value',
				'module source',
				'int value 41',
				'moduleEnd',
				'groupEnd',
				'entryEnd',
			].join('\n')
		);
		const result = await compileProject(project, { disableSharedMemory: true });
		const exposure = result.projectMemoryExposuresByGroupPath.audio[0]!;
		const targetMemory = result.memoryPlan.modules['audio/source']!.memory.value!;

		expect(exposure).toMatchObject({
			name: 'exposedValue',
			type: 'int',
			groupPath: 'audio',
			targetModuleId: 'audio/source',
			targetMemoryName: 'value',
		});
		expect(exposure.targetMemory).toBe(targetMemory);
		expect(result.memoryPlan.modules.audio).toBeUndefined();

		const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
		const { instance } = await WebAssembly.instantiate(result.codeBuffer, { host: { memory } });
		(instance.exports.initDefaults as CallableFunction)();
		(instance.exports.main as CallableFunction)();

		expect(new Int32Array(memory.buffer)[result.memoryPlan.modules.root!.memory.observed!.wordAlignedAddress]).toBe(41);
	});

	it('preserves module array order while grouping execution by entry', async () => {
		const project: ProjectObjectModel = {
			...directProject,
			functions: [],
			modules: [
				{ id: 1, entry: 'alternate', code: ['module firstAlternate', 'moduleEnd'] },
				{ id: 2, entry: 'main', code: ['module mainModule', 'moduleEnd'] },
				{ id: 3, entry: 'alternate', code: ['module secondAlternate', 'moduleEnd'] },
			],
		};

		const result = await compileProject(project, { disableSharedMemory: true });
		expect(Object.values(result.compiledModules).sort((a, b) => a.index - b.index)).toMatchObject([
			{ id: 'firstAlternate', executionEntryName: 'alternate' },
			{ id: 'mainModule', executionEntryName: 'main' },
			{ id: 'secondAlternate', executionEntryName: 'alternate' },
		]);
	});
});
