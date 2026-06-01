import type { CompilerASTLine, MacroDefinition, Module } from '@8f4e/compiler-spec';
import { documentBlockInstructionByType, ErrorCode } from '@8f4e/compiler-spec';
import { instructionParser, isComment, isInstructionLikeLine } from '@8f4e/tokenizer';
import { getError } from '../compilerError';

const macroDefinitionInstruction = documentBlockInstructionByType.macro.start;
const macroDefinitionEndInstruction = documentBlockInstructionByType.macro.end;
const macroCallInstruction = documentBlockInstructionByType.macro.type;

function parseInstructionLikeLine(line: string): RegExpMatchArray | null {
	if (isComment(line) || !isInstructionLikeLine(line)) {
		return null;
	}

	return line.match(instructionParser)!;
}

function createMacroErrorLine(lineIndex: number): CompilerASTLine {
	return {
		lineNumber: lineIndex,
		instruction: 'block',
		arguments: [],
	};
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
			const match = parseInstructionLikeLine(line);
			if (!match) {
				return;
			}

			const instruction = match[1];

			if (instruction === macroDefinitionInstruction) {
				if (insideMacro) {
					throw getError(ErrorCode.NESTED_MACRO_DEFINITION, createMacroErrorLine(lineIndex));
				}

				if (macroCount > 0) {
					throw new Error(
						`Line ${lineIndex}: Each code block can contain only one macro definition. Found multiple '${macroDefinitionInstruction}' declarations.`
					);
				}

				const macroName = match[2];
				if (!macroName) {
					throw new Error(`Line ${lineIndex}: Missing macro name after '${macroDefinitionInstruction}'.`);
				}

				if (macroMap.has(macroName)) {
					throw getError(ErrorCode.DUPLICATE_MACRO_NAME, createMacroErrorLine(lineIndex));
				}

				currentMacro = {
					name: macroName,
					body: [],
					definitionLineNumber: lineIndex,
				};
				insideMacro = true;
				macroCount++;
			} else if (instruction === macroDefinitionEndInstruction) {
				if (!insideMacro || !currentMacro) {
					throw getError(ErrorCode.MISSING_MACRO_END, createMacroErrorLine(lineIndex));
				}

				macroMap.set(currentMacro.name, currentMacro);
				currentMacro = null;
				insideMacro = false;
			} else if (insideMacro) {
				// Check for nested macro calls or definitions inside macro body
				if (instruction === macroCallInstruction) {
					throw getError(ErrorCode.NESTED_MACRO_CALL, createMacroErrorLine(lineIndex));
				}

				// Add line to current macro body
				currentMacro!.body.push(line);
			}
		});

		// Check if any macro was left unclosed
		if (insideMacro) {
			const macro = currentMacro!;
			throw getError(ErrorCode.MISSING_MACRO_END, createMacroErrorLine(macro.definitionLineNumber));
		}
	});

	return macroMap;
}

/**
 * Expand macros in a single source module.
 * Each `macro <name>` instruction is replaced with the macro body.
 *
 * @param module Source module to expand
 * @param macroDefinitions Map of macro definitions
 * @returns Array of expanded source lines
 * @throws Error if an undefined macro is referenced
 */
export function expandMacros(module: Module, macroDefinitions: Map<string, MacroDefinition>): string[] {
	const expandedLines: string[] = [];
	const { code } = module;

	code.forEach((line, lineIndex) => {
		const match = parseInstructionLikeLine(line);
		if (!match) {
			expandedLines.push(line);
			return;
		}

		const instruction = match[1];

		if (instruction === macroCallInstruction) {
			const macroName = match[2];
			if (!macroName) {
				throw new Error(`Line ${lineIndex}: Missing macro name after '${macroCallInstruction}'.`);
			}

			const macroDef = macroDefinitions.get(macroName);
			if (!macroDef) {
				throw getError(ErrorCode.UNDEFINED_MACRO, createMacroErrorLine(lineIndex));
			}

			macroDef.body.forEach(macroLine => {
				expandedLines.push(macroLine);
			});
		} else {
			// Regular instruction, not a macro call
			expandedLines.push(line);
		}
	});

	return expandedLines;
}
