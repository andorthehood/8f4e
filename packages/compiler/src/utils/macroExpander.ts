import instructionParser from '../syntax/instructionParser';
import isComment from '../syntax/isComment';
import { ErrorCode } from '../errors';

/**
 * Represents a line of code with its original line number and optionally a call-site line number.
 * When a macro is expanded, the expanded lines have their callSiteLineNumber set to the line
 * where the macro was called, preserving error attribution.
 */
export interface ExpandedLine {
	line: string;
	lineNumber: number;
	callSiteLineNumber?: number;
}

/**
 * Represents a macro definition collected from the source code.
 */
interface MacroDefinition {
	name: string;
	body: string[];
	startLineNumber: number;
}

/**
 * Result of macro expansion, containing the expanded lines and any errors encountered.
 */
export interface MacroExpansionResult {
	expandedLines: ExpandedLine[];
	errors: Array<{ code: ErrorCode; lineNumber: number; message: string }>;
}

/**
 * Expands macros in the given source code lines.
 *
 * This function:
 * 1. Collects all macro definitions (defineMacro <name> ... defineMacroEnd)
 * 2. Validates macro definitions (no duplicates, no nesting, proper end markers)
 * 3. Expands macro calls (macro <name>) into their body
 * 4. Preserves call-site line numbers for error mapping
 *
 * @param lines - The source code lines to process
 * @returns MacroExpansionResult containing expanded lines and any errors
 */
export function expandMacros(lines: string[]): MacroExpansionResult {
	const macros = new Map<string, MacroDefinition>();
	const errors: MacroExpansionResult['errors'] = [];
	const expandedLines: ExpandedLine[] = [];

	let currentMacro: MacroDefinition | null = null;
	let i = 0;

	// First pass: collect macro definitions
	while (i < lines.length) {
		const line = lines[i];
		const lineNumber = i;

		// Skip comments
		if (isComment(line)) {
			if (!currentMacro) {
				expandedLines.push({ line, lineNumber });
			} else {
				// Comments inside macro bodies are part of the macro
				currentMacro.body.push(line);
			}
			i++;
			continue;
		}

		const match = line.match(instructionParser);
		if (!match) {
			if (!currentMacro) {
				expandedLines.push({ line, lineNumber });
			} else {
				// Empty lines inside macro bodies are part of the macro
				currentMacro.body.push(line);
			}
			i++;
			continue;
		}

		const [, instruction, arg1] = match;

		// Handle defineMacro start
		if (instruction === 'defineMacro') {
			// If already inside a macro, this is a nested definition (error)
			if (currentMacro) {
				errors.push({
					code: ErrorCode.NESTED_MACRO_DEFINITION,
					lineNumber,
					message: 'defineMacro cannot be used inside a macro body.',
				});
				currentMacro.body.push(line);
				i++;
				continue;
			}

			if (!arg1 || arg1.trim() === '') {
				errors.push({
					code: ErrorCode.MISSING_ARGUMENT,
					lineNumber,
					message: 'defineMacro requires a macro name.',
				});
				i++;
				continue;
			}

			const macroName = arg1.trim();
			if (macros.has(macroName)) {
				errors.push({
					code: ErrorCode.DUPLICATE_MACRO_NAME,
					lineNumber,
					message: `Duplicate macro name: ${macroName}`,
				});
				// Continue tracking the macro body to properly handle defineMacroEnd
			}

			currentMacro = {
				name: macroName,
				body: [],
				startLineNumber: lineNumber,
			};
			i++;
			continue;
		}

		// Handle defineMacroEnd
		if (instruction === 'defineMacroEnd') {
			if (!currentMacro) {
				errors.push({
					code: ErrorCode.MISSING_BLOCK_START_INSTRUCTION,
					lineNumber,
					message: 'defineMacroEnd without matching defineMacro.',
				});
				i++;
				continue;
			}

			macros.set(currentMacro.name, currentMacro);
			currentMacro = null;
			i++;
			continue;
		}

		// If inside a macro definition, add line to body
		if (currentMacro) {
			// Check for macro calls in body (defineMacro already handled above)
			if (instruction === 'macro') {
				errors.push({
					code: ErrorCode.MACRO_CALL_IN_MACRO_BODY,
					lineNumber,
					message: 'Macro calls inside macro bodies are not allowed.',
				});
			}
			currentMacro.body.push(line);
			i++;
			continue;
		}

		// Handle macro calls
		if (instruction === 'macro') {
			if (!arg1 || arg1.trim() === '') {
				errors.push({
					code: ErrorCode.MISSING_ARGUMENT,
					lineNumber,
					message: 'macro requires a macro name.',
				});
				expandedLines.push({ line, lineNumber });
				i++;
				continue;
			}

			const macroName = arg1.trim();
			const macro = macros.get(macroName);

			if (!macro) {
				errors.push({
					code: ErrorCode.UNDEFINED_MACRO,
					lineNumber,
					message: `Undefined macro: ${macroName}`,
				});
				expandedLines.push({ line, lineNumber });
				i++;
				continue;
			}

			// Expand the macro body, mapping all expanded lines to this call site
			for (const macroLine of macro.body) {
				expandedLines.push({
					line: macroLine,
					lineNumber: expandedLines.length,
					callSiteLineNumber: lineNumber,
				});
			}
			i++;
			continue;
		}

		// Regular line (not macro-related)
		expandedLines.push({ line, lineNumber });
		i++;
	}

	// Check for unclosed macro definition
	if (currentMacro) {
		errors.push({
			code: ErrorCode.MISSING_MACRO_END,
			lineNumber: currentMacro.startLineNumber,
			message: `Missing defineMacroEnd for macro: ${currentMacro.name}`,
		});
	}

	return { expandedLines, errors };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('expandMacros', () => {
		it('should expand a simple macro', () => {
			const lines = [
				'defineMacro increment',
				'push 1',
				'add',
				'defineMacroEnd',
				'',
				'push x',
				'macro increment',
				'store',
			];

			const result = expandMacros(lines);
			expect(result.errors).toHaveLength(0);

			// Find the expanded macro lines
			const macroCallLine = 6;
			const expandedMacroLines = result.expandedLines.filter(el => el.callSiteLineNumber === macroCallLine);

			expect(expandedMacroLines).toHaveLength(2);
			expect(expandedMacroLines[0].line).toBe('push 1');
			expect(expandedMacroLines[0].callSiteLineNumber).toBe(macroCallLine);
			expect(expandedMacroLines[1].line).toBe('add');
			expect(expandedMacroLines[1].callSiteLineNumber).toBe(macroCallLine);
		});

		it('should detect duplicate macro names', () => {
			const lines = ['defineMacro foo', 'push 1', 'defineMacroEnd', 'defineMacro foo', 'push 2', 'defineMacroEnd'];

			const result = expandMacros(lines);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].code).toBe(ErrorCode.DUPLICATE_MACRO_NAME);
			expect(result.errors[0].lineNumber).toBe(3);
		});

		it('should detect undefined macro', () => {
			const lines = ['push x', 'macro undefined', 'store'];

			const result = expandMacros(lines);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].code).toBe(ErrorCode.UNDEFINED_MACRO);
			expect(result.errors[0].lineNumber).toBe(1);
		});

		it('should detect missing defineMacroEnd', () => {
			const lines = ['defineMacro incomplete', 'push 1', 'add'];

			const result = expandMacros(lines);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].code).toBe(ErrorCode.MISSING_MACRO_END);
			expect(result.errors[0].lineNumber).toBe(0);
		});

		it('should detect nested macro definitions', () => {
			const lines = ['defineMacro outer', 'defineMacro inner', 'push 1', 'defineMacroEnd', 'defineMacroEnd'];

			const result = expandMacros(lines);
			expect(result.errors).toHaveLength(2);
			expect(result.errors[0].code).toBe(ErrorCode.NESTED_MACRO_DEFINITION);
			expect(result.errors[0].lineNumber).toBe(1);
			// Second error is for the orphaned defineMacroEnd
			expect(result.errors[1].code).toBe(ErrorCode.MISSING_BLOCK_START_INSTRUCTION);
			expect(result.errors[1].lineNumber).toBe(4);
		});

		it('should detect macro calls inside macro bodies', () => {
			const lines = [
				'defineMacro outer',
				'push 1',
				'defineMacroEnd',
				'defineMacro recursive',
				'macro outer',
				'defineMacroEnd',
			];

			const result = expandMacros(lines);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].code).toBe(ErrorCode.MACRO_CALL_IN_MACRO_BODY);
			expect(result.errors[0].lineNumber).toBe(4);
		});

		it('should handle comments in macro bodies', () => {
			const lines = ['defineMacro commented', '; this is a comment', 'push 1', 'defineMacroEnd', 'macro commented'];

			const result = expandMacros(lines);
			expect(result.errors).toHaveLength(0);

			const macroCallLine = 4;
			const expandedMacroLines = result.expandedLines.filter(el => el.callSiteLineNumber === macroCallLine);

			expect(expandedMacroLines).toHaveLength(2);
			expect(expandedMacroLines[0].line).toBe('; this is a comment');
			expect(expandedMacroLines[1].line).toBe('push 1');
		});

		it('should preserve line numbers for non-macro code', () => {
			const lines = ['push 1', 'add', 'store'];

			const result = expandMacros(lines);
			expect(result.errors).toHaveLength(0);
			expect(result.expandedLines).toHaveLength(3);
			expect(result.expandedLines[0].lineNumber).toBe(0);
			expect(result.expandedLines[1].lineNumber).toBe(1);
			expect(result.expandedLines[2].lineNumber).toBe(2);
			expect(result.expandedLines[0].callSiteLineNumber).toBeUndefined();
			expect(result.expandedLines[1].callSiteLineNumber).toBeUndefined();
			expect(result.expandedLines[2].callSiteLineNumber).toBeUndefined();
		});

		it('should handle multiple macro expansions', () => {
			const lines = [
				'defineMacro inc',
				'push 1',
				'add',
				'defineMacroEnd',
				'defineMacro dec',
				'push 1',
				'sub',
				'defineMacroEnd',
				'push x',
				'macro inc',
				'macro dec',
				'store',
			];

			const result = expandMacros(lines);
			expect(result.errors).toHaveLength(0);

			// Check first expansion
			const firstCallLine = 9;
			const firstExpanded = result.expandedLines.filter(el => el.callSiteLineNumber === firstCallLine);
			expect(firstExpanded).toHaveLength(2);

			// Check second expansion
			const secondCallLine = 10;
			const secondExpanded = result.expandedLines.filter(el => el.callSiteLineNumber === secondCallLine);
			expect(secondExpanded).toHaveLength(2);
		});
	});
}
