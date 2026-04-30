import { instructionParser, isComment, isValidInstruction } from '@8f4e/tokenizer';

import { ErrorCode, getError } from '../compilerError';

import type { AST, ExpandedLine, Instruction, MacroDefinition, Module } from '@8f4e/compiler-types';

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
						lineNumberBeforeMacroExpansion: lineIndex,
						lineNumberAfterMacroExpansion: lineIndex,
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
						lineNumberBeforeMacroExpansion: lineIndex,
						lineNumberAfterMacroExpansion: lineIndex,
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
						lineNumberBeforeMacroExpansion: lineIndex,
						lineNumberAfterMacroExpansion: lineIndex,
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
						lineNumberBeforeMacroExpansion: lineIndex,
						lineNumberAfterMacroExpansion: lineIndex,
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
				lineNumberBeforeMacroExpansion: macro.definitionLineNumber,
				lineNumberAfterMacroExpansion: macro.definitionLineNumber,
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
					lineNumberBeforeMacroExpansion: lineIndex,
					lineNumberAfterMacroExpansion: lineIndex,
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
