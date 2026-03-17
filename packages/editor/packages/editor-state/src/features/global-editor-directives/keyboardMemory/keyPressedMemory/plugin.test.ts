import { describe, expect, it } from 'vitest';

import { parseBlockDirectives } from '../../../code-blocks/utils/parseBlockDirectives';
import { resolveGlobalEditorDirectives } from '../../registry';

function createParsedBlock(
	code: string[],
	overrides: { id?: string; moduleId?: string; blockType?: 'module' | 'config' } = {}
) {
	return {
		id: overrides.id,
		moduleId: overrides.moduleId,
		blockType: overrides.blockType,
		parsedDirectives: parseBlockDirectives(code),
	};
}

describe('@keyPressedMemory directive', () => {
	it('reports usage outside module blocks', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['config project', '; @keyPressedMemory keyPressed', 'configEnd'], {
					id: 'project_config',
					blockType: 'config',
				}),
			],
			{}
		);

		expect(result.resolved.keyPressedMemoryId).toBeUndefined();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('only be used inside a module block');
		expect(result.errors[0].codeBlockId).toBe('project_config');
	});

	it('allows duplicate identical targets', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module keyboard', '; @keyPressedMemory keyPressed', 'moduleEnd'], {
					moduleId: 'keyboard',
					blockType: 'module',
				}),
				createParsedBlock(['module keyboard', '; @keyPressedMemory keyPressed', 'moduleEnd'], {
					moduleId: 'keyboard',
					blockType: 'module',
				}),
			],
			{}
		);

		expect(result.resolved.keyPressedMemoryId).toBe('keyboard.keyPressed');
		expect(result.errors).toEqual([]);
	});
});
