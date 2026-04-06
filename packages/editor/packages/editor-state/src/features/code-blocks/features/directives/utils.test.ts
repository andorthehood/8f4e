import { describe, it, expect } from 'vitest';

import { parseDirectiveLine, normalizeEditorDirectiveRecords } from './utils';
import { createDirectivePlugin } from './utils';

describe('parseDirectiveLine', () => {
	it('parses a full-line editor directive', () => {
		expect(parseDirectiveLine('; @pos 10 20')).toEqual({
			prefix: '@',
			name: 'pos',
			args: ['10', '20'],
			isTrailing: false,
		});
	});

	it('parses a full-line runtime directive', () => {
		expect(parseDirectiveLine('; ~sampleRate 44100')).toEqual({
			prefix: '~',
			name: 'sampleRate',
			args: ['44100'],
			isTrailing: false,
		});
	});

	it('parses a full-line directive with no arguments', () => {
		expect(parseDirectiveLine('; @disabled')).toEqual({
			prefix: '@',
			name: 'disabled',
			args: [],
			isTrailing: false,
		});
	});

	it('parses a full-line directive with leading whitespace', () => {
		expect(parseDirectiveLine('   ; @group myGroup')).toEqual({
			prefix: '@',
			name: 'group',
			args: ['myGroup'],
			isTrailing: false,
		});
	});

	it('parses a trailing inline editor directive', () => {
		expect(parseDirectiveLine('int foo 1 ; @watch')).toEqual({
			prefix: '@',
			name: 'watch',
			args: [],
			isTrailing: true,
		});
	});

	it('parses a trailing inline directive with arguments', () => {
		expect(parseDirectiveLine('int foo 1 ; @watch value')).toEqual({
			prefix: '@',
			name: 'watch',
			args: ['value'],
			isTrailing: true,
		});
	});

	it('returns undefined for a plain comment', () => {
		expect(parseDirectiveLine('; this is a plain comment')).toBeUndefined();
	});

	it('returns undefined for a non-comment line', () => {
		expect(parseDirectiveLine('push 1')).toBeUndefined();
	});

	it('returns undefined for an empty line', () => {
		expect(parseDirectiveLine('')).toBeUndefined();
	});

	it('prefers the full-line pattern over trailing when a line is a pure directive comment', () => {
		// A line like "; @watch" should be treated as full-line (isTrailing: false),
		// not as a trailing comment, because the full-line pattern matches first.
		expect(parseDirectiveLine('; @watch')).toEqual({
			prefix: '@',
			name: 'watch',
			args: [],
			isTrailing: false,
		});
	});

	it('does not parse trailing runtime (~) directives', () => {
		// The trailing pattern only matches @, not ~.
		expect(parseDirectiveLine('int foo 1 ; ~runtime')).toBeUndefined();
	});
});

describe('normalizeEditorDirectiveRecords', () => {
	const watchPlugin = createDirectivePlugin('watch', () => undefined, { aliases: ['w'], allowTrailingComment: true });
	const plotPlugin = createDirectivePlugin('plot', () => undefined);

	it('normalizes alias to canonical plugin name', () => {
		const records = [{ prefix: '@' as const, name: 'w', args: ['value'], rawRow: 0 }];
		expect(normalizeEditorDirectiveRecords(records, [watchPlugin])).toEqual([
			{ name: 'watch', rawRow: 0, args: ['value'], sourceLine: undefined },
		]);
	});

	it('filters out runtime (~) records', () => {
		const records = [{ prefix: '~' as const, name: 'sampleRate', args: ['44100'], rawRow: 0 }];
		expect(normalizeEditorDirectiveRecords(records, [watchPlugin])).toEqual([]);
	});

	it('filters out unknown directive names', () => {
		const records = [{ prefix: '@' as const, name: 'unknown', args: [], rawRow: 0 }];
		expect(normalizeEditorDirectiveRecords(records, [watchPlugin])).toEqual([]);
	});

	it('allows trailing directives for plugins with allowTrailingComment', () => {
		const records = [{ prefix: '@' as const, name: 'watch', args: [], rawRow: 1, isTrailing: true as const }];
		expect(normalizeEditorDirectiveRecords(records, [watchPlugin])).toEqual([
			{ name: 'watch', rawRow: 1, args: [], sourceLine: undefined },
		]);
	});

	it('blocks trailing directives for plugins without allowTrailingComment', () => {
		const records = [{ prefix: '@' as const, name: 'plot', args: ['buf'], rawRow: 2, isTrailing: true as const }];
		expect(normalizeEditorDirectiveRecords(records, [plotPlugin])).toEqual([]);
	});

	it('allows non-trailing directives for plugins without allowTrailingComment', () => {
		const records = [{ prefix: '@' as const, name: 'plot', args: ['buf'], rawRow: 2 }];
		expect(normalizeEditorDirectiveRecords(records, [plotPlugin])).toEqual([
			{ name: 'plot', rawRow: 2, args: ['buf'], sourceLine: undefined },
		]);
	});
});
