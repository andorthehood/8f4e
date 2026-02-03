import instructionParser from '../syntax/instructionParser';
import isComment from '../syntax/isComment';
import isValidInstruction from '../syntax/isValidInstruction';
import { Module } from '../types';

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
					throw new Error(
						`Line ${lineIndex}: Nested macro definitions are not allowed. Found 'defineMacro' inside macro '${currentMacro!.name}'.`
					);
				}

				const macroName = match[2];
				if (!macroName) {
					throw new Error(`Line ${lineIndex}: Missing macro name after 'defineMacro'.`);
				}

				if (macroMap.has(macroName)) {
					throw new Error(`Line ${lineIndex}: Duplicate macro name '${macroName}'.`);
				}

				currentMacro = {
					name: macroName,
					body: [],
					definitionLineNumber: lineIndex,
				};
				insideMacro = true;
			} else if (instruction === 'defineMacroEnd') {
				if (!insideMacro || !currentMacro) {
					throw new Error(`Line ${lineIndex}: 'defineMacroEnd' without matching 'defineMacro'.`);
				}

				macroMap.set(currentMacro.name, currentMacro);
				currentMacro = null;
				insideMacro = false;
			} else if (insideMacro) {
				// Check for nested macro calls or definitions inside macro body
				if (instruction === 'macro') {
					throw new Error(
						`Line ${lineIndex}: Macro calls are not allowed inside macro definitions. Found 'macro' inside macro '${currentMacro!.name}'.`
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
				`Macro '${macro.name}' started at line ${macro.definitionLineNumber} is missing 'defineMacroEnd'.`
			);
		}
	});

	return macroMap;
}

/**
 * Expand macros in source modules.
 * Each `macro <name>` instruction is replaced with the macro body,
 * preserving the call-site line number for error mapping.
 *
 * @param modules Array of source modules to expand
 * @param macroDefinitions Map of macro definitions
 * @returns Array of expanded lines with metadata
 * @throws Error if an undefined macro is referenced
 */
export function expandMacros(modules: Module[], macroDefinitions: Map<string, MacroDefinition>): ExpandedLine[] {
	const expandedLines: ExpandedLine[] = [];

	modules.forEach(module => {
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
					throw new Error(`Line ${lineIndex}: Undefined macro '${macroName}'.`);
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
