import type { MacroDefinition, MacroExpansionResult, LineMapping } from './types';

/**
 * Expands macro call sites in code.
 * Replaces lines matching "macro <name>" with the macro body.
 * Builds line mappings for error attribution.
 */
export function expandMacros(
	code: string[],
	macros: Map<string, MacroDefinition>,
	blockId: string | number
): MacroExpansionResult {
	const expandedCode: string[] = [];
	const lineMappings: LineMapping[] = [];
	const errors: Array<{ message: string; lineNumber: number; blockId: string | number }> = [];

	let expandedLineNumber = 1;

	for (let i = 0; i < code.length; i++) {
		const originalLineNumber = i + 1;
		const line = code[i];
		const macroMatch = /^\s*macro\s+(\w+)(\s|$)/.exec(line);

		if (macroMatch) {
			const macroName = macroMatch[1];
			const macroDef = macros.get(macroName);

			if (!macroDef) {
				errors.push({
					message: `Undefined macro: "${macroName}"`,
					lineNumber: originalLineNumber,
					blockId,
				});
				expandedCode.push(line);
				lineMappings.push({
					expandedLineNumber,
					originalLineNumber,
					originalBlockId: blockId,
				});
				expandedLineNumber++;
			} else {
				for (const bodyLine of macroDef.body) {
					expandedCode.push(bodyLine);
					lineMappings.push({
						expandedLineNumber,
						originalLineNumber,
						originalBlockId: blockId,
					});
					expandedLineNumber++;
				}
			}
		} else {
			expandedCode.push(line);
			lineMappings.push({
				expandedLineNumber,
				originalLineNumber,
				originalBlockId: blockId,
			});
			expandedLineNumber++;
		}
	}

	return { expandedCode, lineMappings, errors };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('expandMacros', () => {
		it('should expand macro call sites with macro body', () => {
			const macros = new Map<string, MacroDefinition>([
				['myMacro', { name: 'myMacro', body: ['push 42', 'pop'], blockId: 'macro1' }],
			]);
			const code = ['module test', 'macro myMacro', 'moduleEnd'];

			const result = expandMacros(code, macros, 'block1');
			expect(result.expandedCode).toEqual(['module test', 'push 42', 'pop', 'moduleEnd']);
			expect(result.errors).toHaveLength(0);
		});

		it('should build line mappings correctly', () => {
			const macros = new Map<string, MacroDefinition>([
				['myMacro', { name: 'myMacro', body: ['push 42', 'pop'], blockId: 'macro1' }],
			]);
			const code = ['module test', 'macro myMacro', 'moduleEnd'];

			const result = expandMacros(code, macros, 'block1');
			expect(result.lineMappings).toEqual([
				{ expandedLineNumber: 1, originalLineNumber: 1, originalBlockId: 'block1' },
				{ expandedLineNumber: 2, originalLineNumber: 2, originalBlockId: 'block1' },
				{ expandedLineNumber: 3, originalLineNumber: 2, originalBlockId: 'block1' },
				{ expandedLineNumber: 4, originalLineNumber: 3, originalBlockId: 'block1' },
			]);
		});

		it('should report errors for undefined macros', () => {
			const macros = new Map<string, MacroDefinition>();
			const code = ['module test', 'macro undefinedMacro', 'moduleEnd'];

			const result = expandMacros(code, macros, 'block1');
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].message).toContain('Undefined macro');
			expect(result.errors[0].lineNumber).toBe(2);
		});

		it('should handle empty macro bodies', () => {
			const macros = new Map<string, MacroDefinition>([
				['emptyMacro', { name: 'emptyMacro', body: [], blockId: 'macro1' }],
			]);
			const code = ['module test', 'macro emptyMacro', 'moduleEnd'];

			const result = expandMacros(code, macros, 'block1');
			expect(result.expandedCode).toEqual(['module test', 'moduleEnd']);
			expect(result.errors).toHaveLength(0);
		});

		it('should handle multiple macro calls', () => {
			const macros = new Map<string, MacroDefinition>([
				['macro1', { name: 'macro1', body: ['push 1'], blockId: 'macro1' }],
				['macro2', { name: 'macro2', body: ['push 2'], blockId: 'macro2' }],
			]);
			const code = ['module test', 'macro macro1', 'macro macro2', 'moduleEnd'];

			const result = expandMacros(code, macros, 'block1');
			expect(result.expandedCode).toEqual(['module test', 'push 1', 'push 2', 'moduleEnd']);
			expect(result.errors).toHaveLength(0);
		});

		it('should not expand lines that contain "macro" but are not macro calls', () => {
			const macros = new Map<string, MacroDefinition>([
				['myMacro', { name: 'myMacro', body: ['push 42'], blockId: 'macro1' }],
			]);
			const code = ['module test', 'some macro code', 'moduleEnd'];

			const result = expandMacros(code, macros, 'block1');
			expect(result.expandedCode).toEqual(['module test', 'some macro code', 'moduleEnd']);
			expect(result.errors).toHaveLength(0);
		});
	});
}
