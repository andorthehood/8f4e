import extractMacroBody from './extractMacroBody';

import type { CodeBlockGraphicData } from '~/types';
import type { MacroCollection } from './types';

/**
 * Collects all macro definitions from code blocks.
 * Validates uniqueness of macro names and returns errors for duplicates.
 */
export function collectMacros(codeBlocks: CodeBlockGraphicData[]): MacroCollection {
	const macros = new Map<string, { name: string; body: string[]; blockId: string | number }>();
	const errors: Array<{ message: string; blockId: string | number }> = [];

	const macroBlocks = codeBlocks
		.filter(block => block.blockType === 'macro')
		.sort((a, b) => a.creationIndex - b.creationIndex);

	for (const block of macroBlocks) {
		const extracted = extractMacroBody(block.code);
		if (!extracted) {
			errors.push({
				message: 'Invalid macro definition: missing name or markers',
				blockId: block.id,
			});
			continue;
		}

		const { name, body } = extracted;

		if (macros.has(name)) {
			errors.push({
				message: `Duplicate macro definition: "${name}" is already defined`,
				blockId: block.id,
			});
		} else {
			macros.set(name, {
				name,
				body,
				blockId: block.id,
			});
		}
	}

	return { macros, errors };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { createMockCodeBlock } = await import('../../pureHelpers/testingUtils/testUtils');

	describe('collectMacros', () => {
		it('should collect macro definitions from code blocks', () => {
			const block1 = createMockCodeBlock({
				code: ['defmacro macro1', 'push 42', 'defmacroEnd'],
				blockType: 'macro',
				creationIndex: 0,
			});
			const block2 = createMockCodeBlock({
				code: ['defmacro macro2', 'pop', 'defmacroEnd'],
				blockType: 'macro',
				creationIndex: 1,
			});
			const codeBlocks = [block1, block2];

			const result = collectMacros(codeBlocks);
			expect(result.macros.size).toBe(2);
			expect(result.macros.get('macro1')).toEqual({
				name: 'macro1',
				body: ['push 42'],
				blockId: block1.id,
			});
			expect(result.macros.get('macro2')).toEqual({
				name: 'macro2',
				body: ['pop'],
				blockId: block2.id,
			});
			expect(result.errors).toHaveLength(0);
		});

		it('should report errors for duplicate macro names', () => {
			const block1 = createMockCodeBlock({
				code: ['defmacro myMacro', 'push 42', 'defmacroEnd'],
				blockType: 'macro',
				creationIndex: 0,
			});
			const block2 = createMockCodeBlock({
				code: ['defmacro myMacro', 'pop', 'defmacroEnd'],
				blockType: 'macro',
				creationIndex: 1,
			});
			const codeBlocks = [block1, block2];

			const result = collectMacros(codeBlocks);
			expect(result.macros.size).toBe(1);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].message).toContain('Duplicate macro definition');
			expect(result.errors[0].blockId).toBe(block2.id);
		});

		it('should report errors for invalid macro definitions', () => {
			const block = createMockCodeBlock({
				code: ['defmacro', 'push 42', 'defmacroEnd'],
				blockType: 'macro',
				creationIndex: 0,
			});
			const codeBlocks = [block];

			const result = collectMacros(codeBlocks);
			expect(result.macros.size).toBe(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].message).toContain('Invalid macro definition');
		});

		it('should ignore non-macro blocks', () => {
			const moduleBlock = createMockCodeBlock({
				code: ['module test', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 0,
			});
			const macroBlock = createMockCodeBlock({
				code: ['defmacro myMacro', 'push 42', 'defmacroEnd'],
				blockType: 'macro',
				creationIndex: 1,
			});
			const codeBlocks = [moduleBlock, macroBlock];

			const result = collectMacros(codeBlocks);
			expect(result.macros.size).toBe(1);
			expect(result.errors).toHaveLength(0);
		});
	});
}
