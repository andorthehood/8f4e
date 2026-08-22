import type { ProjectObjectModel } from '@8f4e/language-spec';
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

	it('compiles grouped modules owned by the canonical module collection', async () => {
		const grouped = parseProjectSource(
			[
				'8f4e/v1',
				'entry main',
				'group audio',
				'module grouped',
				'int value 1',
				'moduleEnd',
				'groupEnd',
				'entryEnd',
			].join('\n')
		);
		expect(grouped.groups).toEqual([{ name: 'audio', entry: 'main', blockIds: [4], groups: [] }]);
		expect((await compileProject(grouped, { disableSharedMemory: true })).compiledModules.grouped).toBeDefined();
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
