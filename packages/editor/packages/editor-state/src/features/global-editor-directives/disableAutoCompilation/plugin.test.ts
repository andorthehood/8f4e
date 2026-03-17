import { describe, expect, it } from 'vitest';

import { parseBlockDirectives } from '../../code-blocks/utils/parseBlockDirectives';
import { resolveGlobalEditorDirectives } from '../registry';

function createParsedBlock(code: string[], overrides: { id?: string; blockType?: 'module' } = {}) {
	return {
		id: overrides.id,
		blockType: overrides.blockType,
		parsedDirectives: parseBlockDirectives(code),
	};
}

describe('@disableAutoCompilation directive', () => {
	it('resolves to true without arguments', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module projectConfig', '; @disableAutoCompilation', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.disableAutoCompilation).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it('allows duplicate identical declarations', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module a', '; @disableAutoCompilation', 'moduleEnd']),
				createParsedBlock(['module b', '; @disableAutoCompilation', 'moduleEnd']),
			],
			{}
		);

		expect(result.resolved.disableAutoCompilation).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it('reports arguments as an error', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @disableAutoCompilation false', 'moduleEnd'], { id: 'module_a' })],
			{}
		);

		expect(result.resolved.disableAutoCompilation).toBeUndefined();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].codeBlockId).toBe('module_a');
		expect(result.errors[0].message).toContain('does not take any arguments');
	});
});
