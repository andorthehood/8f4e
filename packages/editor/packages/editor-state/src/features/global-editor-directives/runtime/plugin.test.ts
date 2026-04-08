import { describe, expect, it } from 'vitest';

import { parseBlockDirectives } from '../../code-blocks/utils/parseBlockDirectives';
import { resolveGlobalEditorDirectives } from '../registry';

function createParsedBlock(code: string[], overrides: { id?: string; moduleId?: string; blockType?: 'module' } = {}) {
	return {
		id: overrides.id,
		moduleId: overrides.moduleId,
		blockType: overrides.blockType,
		parsedDirectives: parseBlockDirectives(code),
	};
}

const runtimeRegistry = {
	WebWorkerLogicRuntime: { id: 'WebWorkerLogicRuntime' },
	AudioWorkletRuntime: { id: 'AudioWorkletRuntime' },
};

describe('@runtime directive', () => {
	it('resolves from a helper module', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module projectConfig', '; @runtime AudioWorkletRuntime', 'moduleEnd'])],
			runtimeRegistry
		);

		expect(result.resolved.runtime).toBe('AudioWorkletRuntime');
		expect(result.errors).toEqual([]);
	});

	it('allows duplicate identical values across blocks', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module a', '; @runtime AudioWorkletRuntime', 'moduleEnd']),
				createParsedBlock(['module b', '; @runtime AudioWorkletRuntime', 'moduleEnd']),
			],
			runtimeRegistry
		);

		expect(result.resolved.runtime).toBe('AudioWorkletRuntime');
		expect(result.errors).toEqual([]);
	});

	it('reports conflicting values', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module a', '; @runtime AudioWorkletRuntime', 'moduleEnd']),
				createParsedBlock(['module b', '; @runtime WebWorkerLogicRuntime', 'moduleEnd']),
			],
			runtimeRegistry
		);

		expect(result.resolved.runtime).toBe('AudioWorkletRuntime');
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('conflicting values');
	});

	it('reports unknown runtime ids', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @runtime UnknownRuntime', 'moduleEnd'])],
			runtimeRegistry
		);

		expect(result.resolved.runtime).toBeUndefined();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('unknown runtime');
	});

	it('suggests the closest runtime id for typos', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @runtime AudioWorkletRuntim', 'moduleEnd'])],
			runtimeRegistry
		);

		expect(result.resolved.runtime).toBeUndefined();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain("Did you mean 'AudioWorkletRuntime'?");
	});

	it('uses block id in errors when available', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module a', '; @runtime UnknownRuntime', 'moduleEnd'], {
					id: 'module_a',
					moduleId: 'a',
					blockType: 'module',
				}),
			],
			runtimeRegistry
		);

		expect(result.errors[0].codeBlockId).toBe('module_a');
	});
});
