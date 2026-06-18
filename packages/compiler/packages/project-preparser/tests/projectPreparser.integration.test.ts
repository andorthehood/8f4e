import { describe, expect, it } from 'vitest';
import {
	type ProjectIncludeResolverAsync,
	parseProjectSource,
	prepareCompilerInputFromProjectSourceAsync,
} from '../src';

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
		const resolveInclude: ProjectIncludeResolverAsync = includeId =>
			({
				'std/events/risingEdge': ['function risingEdge', 'functionEnd int'].join('\n'),
				'std/memory/wrapPointer': [
					'function wrapPointer',
					'functionEnd int*',
					'',
					'function wrapPointer',
					'functionEnd float*',
				].join('\n'),
			})[includeId];

		expect({
			project: parseProjectSource(source),
			compilerInput: await prepareCompilerInputFromProjectSourceAsync(source, {
				resolveInclude,
			}),
		}).toMatchSnapshot();
	});
});
