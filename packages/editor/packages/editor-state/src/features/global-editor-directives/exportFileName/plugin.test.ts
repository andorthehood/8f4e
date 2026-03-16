import { describe, expect, it } from 'vitest';

import { parseBlockDirectives } from '../../code-blocks/utils/parseBlockDirectives';
import { resolveGlobalEditorDirectives } from '../registry';

function createParsedBlock(code: string[], id?: string) {
	return {
		id,
		parsedDirectives: parseBlockDirectives(code),
	};
}

const runtimeRegistry = {};

describe('@exportFileName directive', () => {
	it('resolves from a config block', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['config project', '; @exportFileName xorProblem', 'configEnd'])],
			runtimeRegistry
		);
		expect(result.resolved.exportFileName).toBe('xorProblem');
		expect(result.errors).toEqual([]);
	});

	it('resolves from a module block', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module test', '; @exportFileName demo', 'moduleEnd'])],
			runtimeRegistry
		);
		expect(result.resolved.exportFileName).toBe('demo');
		expect(result.errors).toEqual([]);
	});

	it('allows duplicate identical values across blocks', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module a', '; @exportFileName demo', 'moduleEnd']),
				createParsedBlock(['module b', '; @exportFileName demo', 'moduleEnd']),
			],
			runtimeRegistry
		);
		expect(result.resolved.exportFileName).toBe('demo');
		expect(result.errors).toEqual([]);
	});

	it('reports conflicting values', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module a', '; @exportFileName demo', 'moduleEnd']),
				createParsedBlock(['module b', '; @exportFileName other', 'moduleEnd']),
			],
			runtimeRegistry
		);
		expect(result.resolved.exportFileName).toBe('demo');
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('conflicting values');
	});

	it('reports missing argument', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @exportFileName', 'moduleEnd'])],
			runtimeRegistry
		);
		expect(result.resolved).toEqual({});
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('requires a file name argument');
	});

	it('uses block id in errors when available', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @exportFileName', 'moduleEnd'], 'module_a')],
			runtimeRegistry
		);
		expect(result.errors[0].codeBlockId).toBe('module_a');
	});
});
