import { describe, expect, it } from 'vitest';
import { parseProjectSource, prepareCompilerInputFromProjectSourceTreeAsync } from '../src';

describe('project-preparser integration', () => {
	it('parses project source and prepares compiler input from source-shaped fixtures', async () => {
		const source = [
			'8f4e/v1',
			'',
			'includes',
			'include std/events/risingEdge',
			'include std/memory/wrapPointer',
			'includesEnd',
			'',
			'constants shared',
			'const int tableSize 16',
			'constantsEnd',
			'',
			'function helper',
			'functionEnd int',
			'',
			'prototype state',
			'float phase',
			'int[] buffer 8',
			'prototypeEnd',
			'',
			'note',
			'; @pos 2 3',
			'Document-only project note.',
			'noteEnd',
			'',
			'entry main',
			'module main',
			'shape state',
			'int counter',
			'moduleEnd',
			'group audio',
			'module grouped',
			'int ignoredByCompilerInput',
			'moduleEnd',
			'function groupedHelper',
			'functionEnd int',
			'groupEnd',
			'entryEnd',
		].join('\n');
		expect({
			project: parseProjectSource(source),
			compilerInput: await prepareCompilerInputFromProjectSourceTreeAsync({ source, children: [] }),
		}).toMatchSnapshot();
	});
});
