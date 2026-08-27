import type { ProjectIncludeResolver } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { parseProjectSource, resolveProjectIncludesAsync } from '../src';

describe('project-preparser integration', () => {
	it('preserves root and nested project-scope constant declarations', () => {
		const project = parseProjectSource(
			[
				'8f4e/v1',
				'',
				'; root contract',
				'const SAMPLE_RATE 48000',
				'',
				'entry main',
				'group audio',
				'; child contract',
				'pass SAMPLE_RATE',
				'groupEnd',
				'entryEnd',
			].join('\n')
		);

		expect(project.code).toEqual(['; root contract', 'const SAMPLE_RATE 48000']);
		expect(project.groups[0].code).toEqual(['group audio', '; child contract', 'pass SAMPLE_RATE', 'groupEnd']);
	});

	it('parses project source into typed collections and resolves its include collection', async () => {
		const source = [
			'8f4e/v1',
			'',
			'includes',
			'include std/events/risingEdge',
			'include std/memory/wrapPointer',
			'includesEnd',
			'',
			'constants shared',
			'const TABLE_SIZE 16',
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
		const resolveInclude: ProjectIncludeResolver = includeId =>
			({
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
			})[includeId];

		const project = parseProjectSource(source);
		expect({
			project,
			includedFunctions: await resolveProjectIncludesAsync(project.includes, resolveInclude),
		}).toMatchSnapshot();
	});
});
