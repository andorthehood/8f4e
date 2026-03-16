import { describe, expect, it } from 'vitest';

import { parseBlockDirectives } from '../../code-blocks/utils/parseBlockDirectives';
import { resolveGlobalEditorDirectives } from '../registry';

function createParsedBlock(code: string[], id?: string) {
	return {
		id,
		parsedDirectives: parseBlockDirectives(code),
	};
}

const runtimeRegistry = {
	WebWorkerLogicRuntime: { id: 'WebWorkerLogicRuntime' },
	AudioWorkletRuntime: { id: 'AudioWorkletRuntime' },
};

describe('@runtime directive', () => {
	it('resolves from a config block', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['config project', '; @runtime AudioWorkletRuntime', 'configEnd'])],
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

	it('uses block id in errors when available', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @runtime UnknownRuntime', 'moduleEnd'], 'module_a')],
			runtimeRegistry
		);

		expect(result.errors[0].codeBlockId).toBe('module_a');
	});
});
