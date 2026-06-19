import { describe, expect, it } from 'vitest';
import { resolveIncludeSourceTree } from '../src';

describe('resolveIncludeSourceTree integration', () => {
	it('resolves direct project includes from source-shaped fixtures', () => {
		const source = [
			'8f4e/v1',
			'',
			'includes',
			'; @pos 0 0',
			'include std/events/risingEdge',
			'include std/memory/wrapPointer',
			'include std/events/risingEdge',
			'includesEnd',
			'',
			'constants shared',
			'const int tableSize 16',
			'constantsEnd',
			'',
			'entry main',
			'module main',
			'int counter',
			'moduleEnd',
			'entryEnd',
		].join('\n');

		const includeSources: Record<string, string> = {
			'std/events/risingEdge': [
				'function risingEdge',
				'#export',
				'param int previous',
				'param int current',
				'functionEnd int',
			].join('\n'),
			'std/memory/wrapPointer': [
				'includes',
				'include std/private/addressTools',
				'includesEnd',
				'',
				'function wrapPointer',
				'#export',
				'param int address',
				'functionEnd int*',
			].join('\n'),
		};

		expect(resolveIncludeSourceTree(source, includeId => includeSources[includeId])).toMatchSnapshot();
	});
});
