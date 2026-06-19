import { describe, expect, it } from 'vitest';
import {
	prepareCompilerInputFromProjectBlocksAsync,
	prepareCompilerInputFromProjectBlocksWithIncludeSourceTreeAsync,
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

	it('ignores includes blocks because include resolution is a separate pass', async () => {
		const input = await prepareCompilerInputFromProjectBlocksAsync([
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
		]);

		expect(input.functions).toEqual([]);
		expect(input.entries.main).toEqual([{ code: validModuleBlock, projectBlockId: 11 }]);
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

describe('prepareCompilerInputFromProjectBlocksWithIncludeSourceTreeAsync', () => {
	it('injects pre-resolved include source tree functions at the includes block', async () => {
		const input = await prepareCompilerInputFromProjectBlocksWithIncludeSourceTreeAsync(
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
			{
				children: [
					{
						includeId: 'std/events/risingEdge',
						source: includeSources['std/events/risingEdge'],
						children: [],
					},
					{
						includeId: 'std/memory/wrapPointer',
						source: includeSources['std/memory/wrapPointer'],
						children: [],
					},
				],
			}
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
