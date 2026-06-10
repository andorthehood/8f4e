import { describe, expect, it } from 'vitest';
import { serializeProjectTo8f4e } from './serializeTo8f4e';

const validBlock = ['module counter', '', 'int count', '', 'moduleEnd'];
const validFunctionBlock = ['function sine', 'param float x', 'functionEnd float'];
const validNoteBlock = ['note', '; @pos 1 2', 'compiler should ignore this', 'noteEnd'];

describe('serializeProjectTo8f4e', () => {
	it('produces 8f4e/v1 header', () => {
		const project = { codeBlocks: [{ code: validBlock, entry: 'main' }] };
		const result = serializeProjectTo8f4e(project);
		expect(result.startsWith('8f4e/v1\n')).toBe(true);
	});

	it('serializes multiple code blocks separated by blank lines', () => {
		const project = {
			codeBlocks: [{ code: validBlock, entry: 'main' }, { code: validFunctionBlock }, { code: validNoteBlock }],
		};
		const result = serializeProjectTo8f4e(project);
		expect(result).toContain('\n\n');
		expect(result).toContain('entry main\nmodule counter');
		expect(result).toContain('moduleEnd\nentryEnd');
	});

	it('serializes unique top-level includes from included function metadata', () => {
		const project = {
			codeBlocks: [{ code: validBlock, entry: 'main' }],
			includedFunctionBlocks: [
				{
					code: ['function risingEdge', 'functionEnd int'],
					source: { kind: 'include' as const, includeId: 'std/events/risingEdge', symbolName: 'risingEdge' },
				},
				{
					code: ['function risingEdge', 'functionEnd float'],
					source: { kind: 'include' as const, includeId: 'std/events/risingEdge', symbolName: 'risingEdge' },
				},
				{
					code: ['function hasChanged', 'functionEnd int'],
					source: { kind: 'include' as const, includeId: 'std/events/hasChanged', symbolName: 'hasChanged' },
				},
			],
		};

		expect(serializeProjectTo8f4e(project)).toBe(
			[
				'8f4e/v1',
				'',
				'includes',
				'include std/events/risingEdge',
				'include std/events/hasChanged',
				'includesEnd',
				'',
				'entry main',
				...validBlock,
				'entryEnd',
			].join('\n')
		);
	});

	it('serializes a visible includes block instead of regenerating one from metadata', () => {
		const visibleIncludesBlock = ['includes', 'include std/events/risingEdge', 'includesEnd'];
		const project = {
			codeBlocks: [{ code: visibleIncludesBlock }, { code: validBlock, entry: 'main' }],
			includedFunctionBlocks: [
				{
					code: ['function hasChanged', 'functionEnd int'],
					source: { kind: 'include' as const, includeId: 'std/events/hasChanged', symbolName: 'hasChanged' },
				},
			],
		};

		expect(serializeProjectTo8f4e(project)).toBe(
			['8f4e/v1', '', ...visibleIncludesBlock, '', 'entry main', ...validBlock, 'entryEnd'].join('\n')
		);
	});

	it('serializes execution entries by first module position', () => {
		const project = {
			codeBlocks: [
				{ code: ['module a', 'moduleEnd'], entry: 'main' },
				{ code: validFunctionBlock },
				{ code: ['module b', 'moduleEnd'], entry: 'test' },
				{ code: ['module c', 'moduleEnd'], entry: 'main' },
			],
		};

		expect(serializeProjectTo8f4e(project)).toBe(
			[
				'8f4e/v1',
				'',
				'entry main',
				'module a',
				'moduleEnd',
				'module c',
				'moduleEnd',
				'entryEnd',
				'',
				...validFunctionBlock,
				'',
				'entry test',
				'module b',
				'moduleEnd',
				'entryEnd',
			].join('\n')
		);
	});

	it('accepts note blocks', () => {
		const project = { codeBlocks: [{ code: validNoteBlock }] };
		expect(() => serializeProjectTo8f4e(project)).not.toThrow();
	});

	it('handles empty codeBlocks array', () => {
		const project = { codeBlocks: [] };
		const result = serializeProjectTo8f4e(project);
		expect(result).toBe('8f4e/v1\n\n');
	});

	it('accepts functionEnd with type suffix', () => {
		const project = { codeBlocks: [{ code: validFunctionBlock }] };
		expect(() => serializeProjectTo8f4e(project)).not.toThrow();
	});

	it('throws on missing opener', () => {
		const project = { codeBlocks: [{ code: ['unknownToken', 'moduleEnd'] }] };
		expect(() => serializeProjectTo8f4e(project)).toThrow('unknown or missing opener');
	});

	it('throws on missing closer', () => {
		const project = { codeBlocks: [{ code: ['module foo', 'some code'] }] };
		expect(() => serializeProjectTo8f4e(project)).toThrow('unknown or missing closer');
	});

	it('throws on opener/closer mismatch', () => {
		const project = { codeBlocks: [{ code: ['module foo', 'functionEnd'] }] };
		expect(() => serializeProjectTo8f4e(project)).toThrow('opener/closer mismatch');
	});

	it('throws on mixed block type markers', () => {
		const project = { codeBlocks: [{ code: ['module foo', 'function bar', 'functionEnd', 'moduleEnd'] }] };
		expect(() => serializeProjectTo8f4e(project)).toThrow('mixed block type markers');
	});

	it('throws on closer not at end of block', () => {
		const project = { codeBlocks: [{ code: ['module foo', 'moduleEnd', 'extra line', 'moduleEnd'] }] };
		expect(() => serializeProjectTo8f4e(project)).toThrow('not at the end of the block');
	});

	it('ignores trailing empty lines when finding closer', () => {
		const project = { codeBlocks: [{ code: ['module foo', 'moduleEnd', '', ''], entry: 'main' }] };
		expect(() => serializeProjectTo8f4e(project)).not.toThrow();
	});

	it('throws on module blocks without an entry', () => {
		const project = { codeBlocks: [{ code: validBlock }] };
		expect(() => serializeProjectTo8f4e(project)).toThrow('module block is missing entry');
	});
});
