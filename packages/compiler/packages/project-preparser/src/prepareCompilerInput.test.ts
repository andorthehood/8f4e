import { describe, expect, it } from 'vitest';
import parseProjectSource from './index';
import {
	prepareCompilerInputAsync,
	prepareCompilerInputFromProjectBlocksAsync,
	prepareCompilerInputFromProjectSourceAsync,
	prepareCompilerInputFromProjectSourceTreeAsync,
} from './prepareCompilerInput';

const validModuleBlock = ['module counter', '', 'int count', '', 'moduleEnd'];
const validFunctionBlock = ['function sine', 'param float x', 'functionEnd float'];
const validPrototypeBlock = ['prototype oscillatorState', 'float phase', 'float frequency 440', 'prototypeEnd'];
const validNoteBlock = ['note', '; @pos 2 3', 'remember to tune this later', 'noteEnd'];

const includeSources: Record<string, string> = {
	'std/events/risingEdge': ['function risingEdge', '#export', 'functionEnd int'].join('\n'),
	'std/memory/wrapPointer': [
		'function wrapPointer',
		'#export',
		'functionEnd int*',
		'',
		'function wrapPointer',
		'#export',
		'functionEnd float*',
	].join('\n'),
};

describe('prepareCompilerInputFromProjectBlocksAsync', () => {
	it('classifies plain project blocks into CompileInput collections', async () => {
		await expect(
			prepareCompilerInputFromProjectBlocksAsync([
				{ id: 1, code: validModuleBlock, entry: 'main' },
				{ id: 2, code: validFunctionBlock },
				{ id: 3, code: validPrototypeBlock },
				{ id: 4, code: ['constants', 'const int tableSize 16', 'constantsEnd'] },
				{ id: 5, code: validNoteBlock },
				{ id: 6, code: ['module disabled', 'moduleEnd'], entry: 'main', disabled: true },
			])
		).resolves.toEqual({
			entries: { main: [{ code: validModuleBlock, projectBlockId: 1 }] },
			functions: [{ code: validFunctionBlock, projectBlockId: 2 }],
			constants: [{ code: ['constants', 'const int tableSize 16', 'constantsEnd'], projectBlockId: 4 }],
			prototypes: [{ code: validPrototypeBlock, projectBlockId: 3 }],
		});
	});

	it('preserves the order of project blocks it receives', async () => {
		const input = await prepareCompilerInputFromProjectBlocksAsync([
			{ id: 2, code: ['module second', 'moduleEnd'], entry: 'main' },
			{ id: 1, code: ['module first', 'moduleEnd'], entry: 'main' },
			{ id: 3, code: ['module other', 'moduleEnd'], entry: 'test' },
		]);

		expect(input.entries).toEqual({
			main: [
				{ code: ['module second', 'moduleEnd'], projectBlockId: 2 },
				{ code: ['module first', 'moduleEnd'], projectBlockId: 1 },
			],
			test: [{ code: ['module other', 'moduleEnd'], projectBlockId: 3 }],
		});
	});

	it('reduces includes blocks into function blocks', async () => {
		const input = await prepareCompilerInputFromProjectBlocksAsync(
			[
				{
					id: 10,
					code: [
						'includes',
						'; @pos 0 0',
						'include std/events/risingEdge',
						'include std/memory/wrapPointer',
						'includesEnd',
					],
				},
				{ id: 11, code: validModuleBlock, entry: 'main' },
			],
			{ resolveInclude: async includeId => includeSources[includeId] }
		);

		expect(input.functions).toEqual([
			{
				code: ['function risingEdge', '', 'functionEnd int'],
				source: { kind: 'include', includeId: 'std/events/risingEdge', symbolName: 'risingEdge' },
			},
			{
				code: ['function wrapPointer', '', 'functionEnd int*'],
				source: { kind: 'include', includeId: 'std/memory/wrapPointer', symbolName: 'wrapPointer' },
			},
			{
				code: ['function wrapPointer', '', 'functionEnd float*'],
				source: { kind: 'include', includeId: 'std/memory/wrapPointer', symbolName: 'wrapPointer' },
			},
		]);
		expect(input.entries.main).toEqual([{ code: validModuleBlock, projectBlockId: 11 }]);
	});

	it('throws block-relative include diagnostics', async () => {
		await expect(
			prepareCompilerInputFromProjectBlocksAsync(
				[{ id: 20, code: ['includes', '; @pos 0 0', 'include std/missing', 'includesEnd'] }],
				{ resolveInclude: () => undefined }
			)
		).rejects.toMatchObject({
			name: 'ProjectIncludeError',
			lineNumber: 3,
			message: 'Parse error at line 3: unresolved include "std/missing"',
		});
	});

	it('rejects module blocks without entries', async () => {
		await expect(prepareCompilerInputFromProjectBlocksAsync([{ id: 1, code: validModuleBlock }])).rejects.toThrow(
			'missing entry'
		);
	});

	it('rejects project blocks without numeric ids', async () => {
		await expect(prepareCompilerInputFromProjectBlocksAsync([{ code: validFunctionBlock } as never])).rejects.toThrow(
			'missing numeric id'
		);
	});
});

describe('prepareCompilerInputAsync', () => {
	it('ignores groups because they are not compiler input', async () => {
		const project = {
			codeBlocks: [{ id: 1, code: ['module root', 'moduleEnd'], entry: 'main' }],
			groups: [
				{
					name: 'future',
					entry: 'main',
					codeBlocks: [{ id: 2, code: validFunctionBlock, entry: 'main' }],
					groups: [],
				},
			],
		};

		await expect(prepareCompilerInputAsync(project)).resolves.toEqual({
			entries: { main: [{ code: ['module root', 'moduleEnd'], projectBlockId: 1 }] },
			functions: [],
			constants: [],
			prototypes: [],
		});
	});
});

describe('prepareCompilerInputFromProjectSourceAsync', () => {
	it('parses source and prepares CompileInput', async () => {
		const source = [
			'8f4e/v1',
			'',
			'includes',
			'include std/events/risingEdge',
			'includesEnd',
			'',
			'entry main',
			...validModuleBlock,
			'entryEnd',
		].join('\n');

		const input = await prepareCompilerInputFromProjectSourceAsync(source, {
			resolveInclude: includeId => includeSources[includeId],
		});

		expect(input.entries.main).toEqual([{ code: validModuleBlock, projectBlockId: 8 }]);
		expect(input.functions).toEqual([
			{
				code: ['function risingEdge', '', 'functionEnd int'],
				source: { kind: 'include', includeId: 'std/events/risingEdge', symbolName: 'risingEdge' },
			},
		]);
	});

	it('matches preparing an already parsed project document', async () => {
		const source = ['8f4e/v1', '', 'entry main', ...validModuleBlock, 'entryEnd'].join('\n');

		await expect(prepareCompilerInputFromProjectSourceAsync(source)).resolves.toEqual(
			await prepareCompilerInputAsync(parseProjectSource(source))
		);
	});
});

describe('prepareCompilerInputFromProjectSourceTreeAsync', () => {
	it('prepares compiler input from a raw source tree with pre-resolved includes', async () => {
		const source = [
			'8f4e/v1',
			'',
			'includes',
			'include std/events/risingEdge',
			'includesEnd',
			'',
			'entry main',
			...validModuleBlock,
			'entryEnd',
		].join('\n');

		const input = await prepareCompilerInputFromProjectSourceTreeAsync({
			source,
			children: [
				{
					includeId: 'std/events/risingEdge',
					source: includeSources['std/events/risingEdge'],
					children: [],
				},
			],
		});

		expect(input.entries.main).toEqual([{ code: validModuleBlock, projectBlockId: 8 }]);
		expect(input.functions).toEqual([
			{
				code: ['function risingEdge', '', 'functionEnd int'],
				source: { kind: 'include', includeId: 'std/events/risingEdge', symbolName: 'risingEdge' },
			},
		]);
	});

	it('appends extra compiler blocks after parsing the source tree', async () => {
		const source = ['8f4e/v1', '', 'entry main', ...validModuleBlock, 'entryEnd'].join('\n');

		const input = await prepareCompilerInputFromProjectSourceTreeAsync(
			{ source, children: [] },
			{
				extraBlocks: [
					{
						id: -1,
						code: ['function assert', '#import assert', 'param int received', 'param int expected', 'functionEnd'],
					},
				],
			}
		);

		expect(input.functions).toEqual([
			{
				code: ['function assert', '#import assert', 'param int received', 'param int expected', 'functionEnd'],
				projectBlockId: -1,
			},
		]);
	});
});
