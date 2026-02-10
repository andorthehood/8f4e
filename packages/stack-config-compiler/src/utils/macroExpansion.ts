/**
 * Macro expansion utilities for stack-config-compiler
 *
 * Provides macro definition parsing and expansion with error mapping.
 * Reuses similar logic to @8f4e/compiler but adapted for stack-config syntax.
 */

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
 * Check if a line is a comment
 */
function isComment(line: string): boolean {
	return line.trim().startsWith(';');
}

/**
 * Check if a line is valid (not empty or whitespace-only)
 */
function isValidLine(line: string): boolean {
	return line.trim().length > 0;
}

/**
 * Parse instruction from a line
 */
function parseInstruction(line: string): string | null {
	const trimmed = line.trim();
	const spaceIndex = trimmed.indexOf(' ');
	return spaceIndex === -1 ? trimmed : trimmed.substring(0, spaceIndex);
}

/**
 * Extract macro name from a defineMacro or macro line
 */
function extractMacroName(line: string, instruction: string): string | null {
	const trimmed = line.trim();
	const after = trimmed.substring(instruction.length).trim();
	// Return the first word after the instruction
	const spaceIndex = after.indexOf(' ');
	return spaceIndex === -1 ? after : after.substring(0, spaceIndex);
}

/**
 * Parse macro definitions from macro source strings.
 * Validates that:
 * - Each macro source contains only one macro definition
 * - Each macro has a unique name
 * - Each macro ends with `defineMacroEnd`
 * - No nested macro definitions or calls inside macro bodies
 *
 * @param macroSources Array of macro source strings
 * @returns Map of macro name to definition
 * @throws Error if validation fails
 */
export function parseMacroDefinitions(macroSources: string[]): Map<string, MacroDefinition> {
	const macroMap = new Map<string, MacroDefinition>();

	macroSources.forEach((source, sourceIndex) => {
		const lines = source.split('\n');
		let currentMacro: MacroDefinition | null = null;
		let insideMacro = false;
		let macroCount = 0;

		lines.forEach((line, lineIndex) => {
			// Skip comments
			if (isComment(line)) {
				return;
			}

			// Skip empty or invalid lines
			if (!isValidLine(line)) {
				return;
			}

			const instruction = parseInstruction(line);
			if (!instruction) {
				return;
			}

			if (instruction === 'defineMacro') {
				if (insideMacro) {
					throw new Error(
						`Macro source ${sourceIndex}, line ${lineIndex + 1}: Nested macro definitions are not allowed.`
					);
				}

				if (macroCount > 0) {
					throw new Error(
						`Macro source ${sourceIndex}, line ${lineIndex + 1}: Each macro source can contain only one macro definition. Found multiple 'defineMacro' declarations.`
					);
				}

				const macroName = extractMacroName(line, instruction);
				if (!macroName) {
					throw new Error(
						`Macro source ${sourceIndex}, line ${lineIndex + 1}: Missing macro name after 'defineMacro'.`
					);
				}

				if (macroMap.has(macroName)) {
					throw new Error(
						`Macro source ${sourceIndex}, line ${lineIndex + 1}: Duplicate macro name '${macroName}'. Each macro must have a unique name.`
					);
				}

				currentMacro = {
					name: macroName,
					body: [],
					definitionLineNumber: lineIndex + 1, // Store 1-based line number for consistency
				};
				insideMacro = true;
				macroCount++;
			} else if (instruction === 'defineMacroEnd') {
				if (!insideMacro || !currentMacro) {
					throw new Error(
						`Macro source ${sourceIndex}, line ${lineIndex + 1}: Missing 'defineMacro' before 'defineMacroEnd'.`
					);
				}

				macroMap.set(currentMacro.name, currentMacro);
				currentMacro = null;
				insideMacro = false;
			} else if (insideMacro) {
				// Check for nested macro calls or definitions inside macro body
				if (instruction === 'macro') {
					throw new Error(
						`Macro source ${sourceIndex}, line ${lineIndex + 1}: Macro calls inside macro definitions are not allowed.`
					);
				}

				// Add line to current macro body
				currentMacro!.body.push(line);
			}
		});

		// Check if any macro was left unclosed
		if (insideMacro) {
			const macro = currentMacro!;
			throw new Error(
				`Macro source ${sourceIndex}, line ${macro.definitionLineNumber}: Missing 'defineMacroEnd'. Each 'defineMacro' must be closed with 'defineMacroEnd'.`
			);
		}
	});

	return macroMap;
}

/**
 * Expand macros in source code.
 * Each `macro <name>` instruction is replaced with the macro body,
 * preserving the call-site line number for error mapping.
 *
 * @param source Source code to expand
 * @param macroDefinitions Map of macro definitions
 * @returns Array of expanded lines with metadata
 * @throws Error if an undefined macro is referenced
 */
export function expandMacros(source: string, macroDefinitions: Map<string, MacroDefinition>): ExpandedLine[] {
	const lines = source.split('\n');
	const expandedLines: ExpandedLine[] = [];

	lines.forEach((line, lineIndex) => {
		// For comments and empty lines, preserve as-is
		if (isComment(line) || !isValidLine(line)) {
			expandedLines.push({
				line,
				callSiteLineNumber: lineIndex,
			});
			return;
		}

		const instruction = parseInstruction(line);
		if (!instruction) {
			expandedLines.push({
				line,
				callSiteLineNumber: lineIndex,
			});
			return;
		}

		if (instruction === 'macro') {
			const macroName = extractMacroName(line, instruction);
			if (!macroName) {
				throw new Error(`Line ${lineIndex + 1}: Missing macro name after 'macro'.`);
			}

			const macroDef = macroDefinitions.get(macroName);
			if (!macroDef) {
				throw new Error(
					`Line ${lineIndex + 1}: Undefined macro '${macroName}'. The macro referenced has not been defined.`
				);
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
 * Convert expanded lines back to source string and metadata array.
 * This is used to integrate with the existing parser flow.
 *
 * @param expandedLines Array of expanded lines
 * @returns Object containing source string and line metadata
 */
export function convertExpandedLinesToSource(expandedLines: ExpandedLine[]): {
	source: string;
	lineMetadata: Array<{ callSiteLineNumber: number; macroId?: string }>;
} {
	return {
		source: expandedLines.map(el => el.line).join('\n'),
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
			const macros = ['defineMacro add10\npush 10\nappend\ndefineMacroEnd'];

			const macroMap = parseMacroDefinitions(macros);

			expect(macroMap.size).toBe(1);
			expect(macroMap.has('add10')).toBe(true);
			const macroDef = macroMap.get('add10');
			expect(macroDef?.name).toBe('add10');
			expect(macroDef?.body).toEqual(['push 10', 'append']);
		});

		test('should parse multiple macro definitions from separate sources', () => {
			const macros = [
				'defineMacro double\npush 2\nappend\ndefineMacroEnd',
				'defineMacro triple\npush 3\nappend\ndefineMacroEnd',
			];

			const macroMap = parseMacroDefinitions(macros);

			expect(macroMap.size).toBe(2);
			expect(macroMap.has('double')).toBe(true);
			expect(macroMap.has('triple')).toBe(true);
		});

		test('should throw error on multiple macro definitions in same source', () => {
			const macros = [
				'defineMacro double\npush 2\nappend\ndefineMacroEnd\ndefineMacro triple\npush 3\nappend\ndefineMacroEnd',
			];

			expect(() => parseMacroDefinitions(macros)).toThrow(/Each macro source can contain only one macro definition/);
		});

		test('should skip comments in macro definitions', () => {
			const macros = [
				'; This is a comment\ndefineMacro add10\n; Another comment\npush 10\nappend\n; Final comment\ndefineMacroEnd',
			];

			const macroMap = parseMacroDefinitions(macros);

			expect(macroMap.size).toBe(1);
			const macroDef = macroMap.get('add10');
			expect(macroDef?.body).toEqual(['push 10', 'append']);
		});

		test('should throw error on duplicate macro names', () => {
			const macros = [
				'defineMacro add10\npush 10\nappend\ndefineMacroEnd',
				'defineMacro add10\npush 20\nappend\ndefineMacroEnd',
			];

			expect(() => parseMacroDefinitions(macros)).toThrow(/Duplicate macro name/);
		});

		test('should throw error on missing defineMacroEnd', () => {
			const macros = ['defineMacro add10\npush 10\nappend'];

			expect(() => parseMacroDefinitions(macros)).toThrow(/Missing 'defineMacroEnd'/);
		});

		test('should throw error on nested macro definitions', () => {
			const macros = ['defineMacro outer\npush 10\ndefineMacro inner\npush 20\ndefineMacroEnd\nappend\ndefineMacroEnd'];

			expect(() => parseMacroDefinitions(macros)).toThrow(/Nested macro definitions are not allowed/);
		});

		test('should throw error on macro calls inside macro definitions', () => {
			const macros = ['defineMacro add20\nmacro add10\nmacro add10\ndefineMacroEnd'];

			expect(() => parseMacroDefinitions(macros)).toThrow(/Macro calls inside macro definitions/);
		});

		test('should throw error on defineMacroEnd without matching defineMacro', () => {
			const macros = ['defineMacroEnd'];

			expect(() => parseMacroDefinitions(macros)).toThrow(/Missing 'defineMacro'/);
		});
	});

	describe('expandMacros', () => {
		test('should expand a simple macro call', () => {
			const macros = ['defineMacro add10\npush 10\nappend\ndefineMacroEnd'];
			const source = 'scope "test"\npush 5\nmacro add10\nset';

			const macroMap = parseMacroDefinitions(macros);
			const expanded = expandMacros(source, macroMap);

			expect(expanded.length).toBe(5);
			// Line 0: scope "test"
			expect(expanded[0]).toEqual({ line: 'scope "test"', callSiteLineNumber: 0 });
			// Line 1: push 5
			expect(expanded[1]).toEqual({ line: 'push 5', callSiteLineNumber: 1 });
			// Line 2: macro add10 expands to two lines, both map to line 2
			expect(expanded[2]).toEqual({ line: 'push 10', callSiteLineNumber: 2, macroId: 'add10' });
			expect(expanded[3]).toEqual({ line: 'append', callSiteLineNumber: 2, macroId: 'add10' });
			// Line 3: set
			expect(expanded[4]).toEqual({ line: 'set', callSiteLineNumber: 3 });
		});

		test('should expand multiple macro calls', () => {
			const macros = ['defineMacro double\npush 2\nappend\ndefineMacroEnd'];
			const source = 'scope "test"\npush 5\nmacro double\nmacro double\nset';

			const macroMap = parseMacroDefinitions(macros);
			const expanded = expandMacros(source, macroMap);

			expect(expanded.length).toBe(7);
			// Line 0: scope "test"
			expect(expanded[0]).toEqual({ line: 'scope "test"', callSiteLineNumber: 0 });
			// Line 1: push 5
			expect(expanded[1]).toEqual({ line: 'push 5', callSiteLineNumber: 1 });
			// Line 2: first macro double
			expect(expanded[2]).toEqual({ line: 'push 2', callSiteLineNumber: 2, macroId: 'double' });
			expect(expanded[3]).toEqual({ line: 'append', callSiteLineNumber: 2, macroId: 'double' });
			// Line 3: second macro double
			expect(expanded[4]).toEqual({ line: 'push 2', callSiteLineNumber: 3, macroId: 'double' });
			expect(expanded[5]).toEqual({ line: 'append', callSiteLineNumber: 3, macroId: 'double' });
			// Line 4: set
			expect(expanded[6]).toEqual({ line: 'set', callSiteLineNumber: 4 });
		});

		test('should throw error on undefined macro', () => {
			const macros: string[] = [];
			const source = 'scope "test"\nmacro undefined';

			const macroMap = parseMacroDefinitions(macros);

			expect(() => expandMacros(source, macroMap)).toThrow(/Undefined macro/);
		});

		test('should preserve comments and empty lines', () => {
			const macros = ['defineMacro add10\npush 10\nappend\ndefineMacroEnd'];
			const source = 'scope "test"\n; This is a comment\nmacro add10\n\nset';

			const macroMap = parseMacroDefinitions(macros);
			const expanded = expandMacros(source, macroMap);

			expect(expanded.length).toBe(6);
			expect(expanded[0]).toEqual({ line: 'scope "test"', callSiteLineNumber: 0 });
			expect(expanded[1]).toEqual({ line: '; This is a comment', callSiteLineNumber: 1 });
			expect(expanded[2]).toEqual({ line: 'push 10', callSiteLineNumber: 2, macroId: 'add10' });
			expect(expanded[3]).toEqual({ line: 'append', callSiteLineNumber: 2, macroId: 'add10' });
			expect(expanded[4]).toEqual({ line: '', callSiteLineNumber: 3 });
			expect(expanded[5]).toEqual({ line: 'set', callSiteLineNumber: 4 });
		});
	});

	describe('convertExpandedLinesToSource', () => {
		test('should convert expanded lines to source and metadata', () => {
			const expandedLines = [
				{ line: 'scope "test"', callSiteLineNumber: 0 },
				{ line: 'push 10', callSiteLineNumber: 1, macroId: 'add10' },
				{ line: 'append', callSiteLineNumber: 1, macroId: 'add10' },
				{ line: 'set', callSiteLineNumber: 2 },
			];

			const result = convertExpandedLinesToSource(expandedLines);

			expect(result.source).toBe('scope "test"\npush 10\nappend\nset');

			expect(result.lineMetadata).toEqual([
				{ callSiteLineNumber: 0 },
				{ callSiteLineNumber: 1, macroId: 'add10' },
				{ callSiteLineNumber: 1, macroId: 'add10' },
				{ callSiteLineNumber: 2 },
			]);
		});
	});
}
