import instructionParser from '../syntax/instructionParser';
import isComment from '../syntax/isComment';
import isValidInstruction from '../syntax/isValidInstruction';
import { ErrorCode, getError } from '../errors';

import type { Module } from '../types';
import type { AST } from '../types';
import type { Instruction } from '../instructionCompilers';

/**
 * Represents an expanded source line with metadata for error mapping.
 */
export interface ExpandedLine {
	/** The actual source code line */
	line: string;
	/** The original line number where this line appears (or was expanded to) */
	callSiteLineNumber: number;
	/** The macro ID if this line was expanded from a macro, undefined otherwise */
	macroId?: string;
}

/**
 * Represents a parsed macro definition.
 */
export interface MacroDefinition {
	name: string;
	body: string[];
	/** Line number where the macro is defined (for error reporting) */
	definitionLineNumber: number;
}

/**
 * Parse macro definitions from macro modules.
 * Validates that:
 * - Each code block contains only one macro definition
 * - Each macro has a unique name
 * - Each macro ends with `defineMacroEnd`
 * - No nested macro definitions or calls inside macro bodies
 *
 * @param macros Array of macro modules
 * @returns Map of macro name to definition
 * @throws Error if validation fails
 */
export function parseMacroDefinitions(macros: Module[]): Map<string, MacroDefinition> {
	const macroMap = new Map<string, MacroDefinition>();

	macros.forEach(module => {
		const { code } = module;
		let currentMacro: MacroDefinition | null = null;
		let insideMacro = false;
		let macroCount = 0;

		code.forEach((line, lineIndex) => {
			// Skip comments
			if (isComment(line)) {
				return;
			}

			// Skip empty or invalid lines
			if (!isValidInstruction(line)) {
				return;
			}

			const match = line.match(instructionParser);
			if (!match) {
				return;
			}

			const instruction = match[1];

			if (instruction === 'defineMacro') {
				if (insideMacro) {
					const astLine: AST[number] = {
						lineNumber: lineIndex,
						instruction: 'push' as Instruction, // Placeholder instruction for error reporting
						arguments: [],
					};
					throw getError(ErrorCode.NESTED_MACRO_DEFINITION, astLine);
				}

				if (macroCount > 0) {
					throw new Error(
						`Line ${lineIndex}: Each code block can contain only one macro definition. Found multiple 'defineMacro' declarations.`
					);
				}

				const macroName = match[2];
				if (!macroName) {
					throw new Error(`Line ${lineIndex}: Missing macro name after 'defineMacro'.`);
				}

				if (macroMap.has(macroName)) {
					const astLine: AST[number] = {
						lineNumber: lineIndex,
						instruction: 'push' as Instruction, // Placeholder instruction for error reporting
						arguments: [],
					};
					throw getError(ErrorCode.DUPLICATE_MACRO_NAME, astLine);
				}

				currentMacro = {
					name: macroName,
					body: [],
					definitionLineNumber: lineIndex,
				};
				insideMacro = true;
				macroCount++;
			} else if (instruction === 'defineMacroEnd') {
				if (!insideMacro || !currentMacro) {
					const astLine: AST[number] = {
						lineNumber: lineIndex,
						instruction: 'push' as Instruction, // Placeholder instruction for error reporting
						arguments: [],
					};
					throw getError(ErrorCode.MISSING_MACRO_END, astLine);
				}

				macroMap.set(currentMacro.name, currentMacro);
				currentMacro = null;
				insideMacro = false;
			} else if (insideMacro) {
				// Check for nested macro calls or definitions inside macro body
				if (instruction === 'macro') {
					const astLine: AST[number] = {
						lineNumber: lineIndex,
						instruction: 'push' as Instruction, // Placeholder instruction for error reporting
						arguments: [],
					};
					throw getError(ErrorCode.NESTED_MACRO_CALL, astLine);
				}

				// Add line to current macro body
				currentMacro!.body.push(line);
			}
		});

		// Check if any macro was left unclosed
		if (insideMacro) {
			const macro = currentMacro!;
			const astLine: AST[number] = {
				lineNumber: macro.definitionLineNumber,
				instruction: 'push' as Instruction, // Placeholder instruction for error reporting
				arguments: [],
			};
			throw getError(ErrorCode.MISSING_MACRO_END, astLine);
		}
	});

	return macroMap;
}

/**
 * Expand macros in a single source module.
 * Each `macro <name>` instruction is replaced with the macro body,
 * preserving the call-site line number for error mapping.
 *
 * @param module Source module to expand
 * @param macroDefinitions Map of macro definitions
 * @returns Array of expanded lines with metadata
 * @throws Error if an undefined macro is referenced
 */
export function expandMacros(module: Module, macroDefinitions: Map<string, MacroDefinition>): ExpandedLine[] {
	const expandedLines: ExpandedLine[] = [];
	const { code } = module;

	code.forEach((line, lineIndex) => {
		// For comments and empty lines, preserve as-is
		if (isComment(line) || !isValidInstruction(line)) {
			expandedLines.push({
				line,
				callSiteLineNumber: lineIndex,
			});
			return;
		}

		const match = line.match(instructionParser);
		if (!match) {
			expandedLines.push({
				line,
				callSiteLineNumber: lineIndex,
			});
			return;
		}

		const instruction = match[1];

		if (instruction === 'macro') {
			const macroName = match[2];
			if (!macroName) {
				throw new Error(`Line ${lineIndex}: Missing macro name after 'macro'.`);
			}

			const macroDef = macroDefinitions.get(macroName);
			if (!macroDef) {
				const astLine: AST[number] = {
					lineNumber: lineIndex,
					instruction: 'push' as Instruction, // Placeholder instruction for error reporting
					arguments: [],
				};
				throw getError(ErrorCode.UNDEFINED_MACRO, astLine);
			}

			// Expand macro body, all lines map back to the call site
			macroDef.body.forEach(macroLine => {
				expandedLines.push({
					line: macroLine,
					callSiteLineNumber: lineIndex,
					macroId: macroName,
				});
			});
		} else {
			// Regular instruction, not a macro call
			expandedLines.push({
				line,
				callSiteLineNumber: lineIndex,
			});
		}
	});

	return expandedLines;
}

/**
 * Convert expanded lines back to plain string array and metadata.
 * This is used to integrate with the existing compiler flow.
 *
 * @param expandedLines Array of expanded lines
 * @returns Object containing code array and mapping metadata
 */
export function convertExpandedLinesToCode(expandedLines: ExpandedLine[]): {
	code: string[];
	lineMetadata: Array<{ callSiteLineNumber: number; macroId?: string }>;
} {
	return {
		code: expandedLines.map(el => el.line),
		lineMetadata: expandedLines.map(el => ({
			callSiteLineNumber: el.callSiteLineNumber,
			macroId: el.macroId,
		})),
	};
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe('parseMacroDefinitions', () => {
		test('should parse a simple macro definition', () => {
			const macros: Module[] = [
				{
					code: ['defineMacro add10', 'push 10', 'add', 'defineMacroEnd'],
				},
			];

			const macroMap = parseMacroDefinitions(macros);

			expect(macroMap.size).toBe(1);
			expect(macroMap.has('add10')).toBe(true);
			const macroDef = macroMap.get('add10');
			expect(macroDef?.name).toBe('add10');
			expect(macroDef?.body).toEqual(['push 10', 'add']);
		});

		test('should parse multiple macro definitions from separate code blocks', () => {
			const macros: Module[] = [
				{
					code: ['defineMacro double', 'push 2', 'mul', 'defineMacroEnd'],
				},
				{
					code: ['defineMacro triple', 'push 3', 'mul', 'defineMacroEnd'],
				},
			];

			const macroMap = parseMacroDefinitions(macros);

			expect(macroMap.size).toBe(2);
			expect(macroMap.has('double')).toBe(true);
			expect(macroMap.has('triple')).toBe(true);
		});

		test('should throw error on multiple macro definitions in same code block', () => {
			const macros: Module[] = [
				{
					code: [
						'defineMacro double',
						'push 2',
						'mul',
						'defineMacroEnd',
						'defineMacro triple',
						'push 3',
						'mul',
						'defineMacroEnd',
					],
				},
			];

			expect(() => parseMacroDefinitions(macros)).toThrow(/Each code block can contain only one macro definition/);
		});

		test('should skip comments in macro definitions', () => {
			const macros: Module[] = [
				{
					code: [
						'; This is a comment',
						'defineMacro add10',
						'; Another comment',
						'push 10',
						'add',
						'; Final comment',
						'defineMacroEnd',
					],
				},
			];

			const macroMap = parseMacroDefinitions(macros);

			expect(macroMap.size).toBe(1);
			const macroDef = macroMap.get('add10');
			expect(macroDef?.body).toEqual(['push 10', 'add']);
		});

		test('should throw error on duplicate macro names', () => {
			const macros: Module[] = [
				{
					code: ['defineMacro add10', 'push 10', 'add', 'defineMacroEnd'],
				},
				{
					code: ['defineMacro add10', 'push 20', 'add', 'defineMacroEnd'],
				},
			];

			expect(() => parseMacroDefinitions(macros)).toThrow(/Duplicate macro name/);
		});

		test('should throw error on missing defineMacroEnd', () => {
			const macros: Module[] = [
				{
					code: ['defineMacro add10', 'push 10', 'add'],
				},
			];

			expect(() => parseMacroDefinitions(macros)).toThrow(/Missing defineMacroEnd/);
		});

		test('should throw error on nested macro definitions', () => {
			const macros: Module[] = [
				{
					code: [
						'defineMacro outer',
						'push 10',
						'defineMacro inner',
						'push 20',
						'defineMacroEnd',
						'add',
						'defineMacroEnd',
					],
				},
			];

			expect(() => parseMacroDefinitions(macros)).toThrow(/Nested macro definitions are not allowed/);
		});

		test('should throw error on macro calls inside macro definitions', () => {
			const macros: Module[] = [
				{
					code: ['defineMacro add20', 'macro add10', 'macro add10', 'defineMacroEnd'],
				},
			];

			expect(() => parseMacroDefinitions(macros)).toThrow(/Macro calls inside macro definitions/);
		});

		test('should throw error on defineMacroEnd without matching defineMacro', () => {
			const macros: Module[] = [
				{
					code: ['defineMacroEnd'],
				},
			];

			expect(() => parseMacroDefinitions(macros)).toThrow(/Missing defineMacroEnd/);
		});
	});

	describe('expandMacros', () => {
		test('should expand a simple macro call', () => {
			const macros: Module[] = [
				{
					code: ['defineMacro add10', 'push 10', 'add', 'defineMacroEnd'],
				},
			];

			const modules: Module[] = [
				{
					code: ['module test', 'int result 0', 'cycle', 'push 5', 'macro add10', 'store result', 'cycleEnd'],
				},
			];

			const macroMap = parseMacroDefinitions(macros);
			const expanded = expandMacros(modules[0], macroMap);

			expect(expanded.length).toBe(8);
			// Line 0: module test
			expect(expanded[0]).toEqual({ line: 'module test', callSiteLineNumber: 0 });
			// Line 1: int result 0
			expect(expanded[1]).toEqual({ line: 'int result 0', callSiteLineNumber: 1 });
			// Line 2: cycle
			expect(expanded[2]).toEqual({ line: 'cycle', callSiteLineNumber: 2 });
			// Line 3: push 5
			expect(expanded[3]).toEqual({ line: 'push 5', callSiteLineNumber: 3 });
			// Line 4: macro add10 expands to two lines, both map to line 4
			expect(expanded[4]).toEqual({ line: 'push 10', callSiteLineNumber: 4, macroId: 'add10' });
			expect(expanded[5]).toEqual({ line: 'add', callSiteLineNumber: 4, macroId: 'add10' });
			// Line 5: store result
			expect(expanded[6]).toEqual({ line: 'store result', callSiteLineNumber: 5 });
			// Line 6: cycleEnd
			expect(expanded[7]).toEqual({ line: 'cycleEnd', callSiteLineNumber: 6 });
		});

		test('should expand multiple macro calls', () => {
			const macros: Module[] = [
				{
					code: ['defineMacro double', 'push 2', 'mul', 'defineMacroEnd'],
				},
			];

			const modules: Module[] = [
				{
					code: ['module test', 'push 5', 'macro double', 'macro double'],
				},
			];

			const macroMap = parseMacroDefinitions(macros);
			const expanded = expandMacros(modules[0], macroMap);

			expect(expanded.length).toBe(6);
			// Line 0: module test
			expect(expanded[0]).toEqual({ line: 'module test', callSiteLineNumber: 0 });
			// Line 1: push 5
			expect(expanded[1]).toEqual({ line: 'push 5', callSiteLineNumber: 1 });
			// Line 2: first macro double
			expect(expanded[2]).toEqual({ line: 'push 2', callSiteLineNumber: 2, macroId: 'double' });
			expect(expanded[3]).toEqual({ line: 'mul', callSiteLineNumber: 2, macroId: 'double' });
			// Line 3: second macro double
			expect(expanded[4]).toEqual({ line: 'push 2', callSiteLineNumber: 3, macroId: 'double' });
			expect(expanded[5]).toEqual({ line: 'mul', callSiteLineNumber: 3, macroId: 'double' });
		});

		test('should throw error on undefined macro', () => {
			const macros: Module[] = [];

			const modules: Module[] = [
				{
					code: ['module test', 'macro undefined'],
				},
			];

			const macroMap = parseMacroDefinitions(macros);

			expect(() => expandMacros(modules[0], macroMap)).toThrow(/Undefined macro/);
		});

		test('should preserve comments and empty lines', () => {
			const macros: Module[] = [
				{
					code: ['defineMacro add10', 'push 10', 'add', 'defineMacroEnd'],
				},
			];

			const modules: Module[] = [
				{
					code: ['module test', '; This is a comment', 'macro add10', ''],
				},
			];

			const macroMap = parseMacroDefinitions(macros);
			const expanded = expandMacros(modules[0], macroMap);

			expect(expanded.length).toBe(5);
			expect(expanded[0]).toEqual({ line: 'module test', callSiteLineNumber: 0 });
			expect(expanded[1]).toEqual({ line: '; This is a comment', callSiteLineNumber: 1 });
			expect(expanded[2]).toEqual({ line: 'push 10', callSiteLineNumber: 2, macroId: 'add10' });
			expect(expanded[3]).toEqual({ line: 'add', callSiteLineNumber: 2, macroId: 'add10' });
			expect(expanded[4]).toEqual({ line: '', callSiteLineNumber: 3 });
		});
	});

	describe('convertExpandedLinesToCode', () => {
		test('should convert expanded lines to code and metadata', () => {
			const expandedLines = [
				{ line: 'module test', callSiteLineNumber: 0 },
				{ line: 'push 10', callSiteLineNumber: 1, macroId: 'add10' },
				{ line: 'add', callSiteLineNumber: 1, macroId: 'add10' },
				{ line: 'store result', callSiteLineNumber: 2 },
			];

			const result = convertExpandedLinesToCode(expandedLines);

			expect(result.code).toEqual(['module test', 'push 10', 'add', 'store result']);

			expect(result.lineMetadata).toEqual([
				{ callSiteLineNumber: 0 },
				{ callSiteLineNumber: 1, macroId: 'add10' },
				{ callSiteLineNumber: 1, macroId: 'add10' },
				{ callSiteLineNumber: 2 },
			]);
		});
	});
}
