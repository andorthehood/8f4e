import { describe, expect, it } from 'vitest';

import { parseBlockDirectives } from '../../../code-blocks/utils/parseBlockDirectives';
import { resolveGlobalEditorDirectives } from '../../registry';

function createParsedBlock(code: string[], overrides: { id?: string; moduleId?: string; blockType?: 'module' } = {}) {
	return {
		id: overrides.id,
		moduleId: overrides.moduleId,
		blockType: overrides.blockType,
		parsedDirectives: parseBlockDirectives(code),
	};
}

describe('@keyCodeMemory directive', () => {
	it('resolves a module-local memory id to a fully qualified memory id', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module keyboard', '; @keyCodeMemory keyCode', 'moduleEnd'], {
					moduleId: 'keyboard',
					blockType: 'module',
				}),
			],
			{}
		);

		expect(result.resolved.keyCodeMemoryId).toBe('keyboard.keyCode');
		expect(result.errors).toEqual([]);
	});

	it('reports conflicts between different targets', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module a', '; @keyCodeMemory keyCode', 'moduleEnd'], {
					moduleId: 'a',
					blockType: 'module',
				}),
				createParsedBlock(['module b', '; @keyCodeMemory keyCode', 'moduleEnd'], {
					moduleId: 'b',
					blockType: 'module',
				}),
			],
			{}
		);

		expect(result.resolved.keyCodeMemoryId).toBe('a.keyCode');
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('conflicting values');
	});
});
