import instructionParser from './syntax/instructionParser';
import isComment from './syntax/isComment';
import isMemoryDeclarationInstruction from './syntax/isMemoryDeclarationInstruction';
import isSemanticOnlyInstruction from './syntax/isSemanticOnlyInstruction';
import isValidInstruction from './syntax/isValidInstruction';
import { parseArgument } from './syntax/parseArgument';
import { SyntaxRulesError, SyntaxErrorCode } from './syntax/syntaxError';
import validateInstructionArguments from './syntax/validateInstructionArguments';

import type { AST, ASTLine, ParsedLineMetadata } from './types';

/**
 * Tokenizes an instruction line, treating quoted strings as single tokens.
 * Stops at an unquoted semicolon (comment delimiter).
 * Escape sequences inside quotes are preserved for parseArgument to decode.
 */
function tokenizeInstruction(line: string): string[] {
	const tokens: string[] = [];
	let i = 0;
	const len = line.length;

	while (i < len) {
		if (/\s/.test(line[i])) {
			i++;
			continue;
		}

		if (line[i] === ';') break;

		if (line[i] === '"') {
			let token = '"';
			i++;
			while (i < len && line[i] !== '"') {
				if (line[i] === '\\' && i + 1 < len) {
					token += line[i] + line[i + 1];
					i += 2;
				} else {
					token += line[i++];
				}
			}
			if (i >= len) {
				throw new SyntaxRulesError(SyntaxErrorCode.INVALID_STRING_LITERAL, 'Unterminated string literal');
			}
			token += '"';
			i++;
			tokens.push(token);
		} else {
			let token = '';
			while (i < len && !/\s/.test(line[i]) && line[i] !== ';') {
				token += line[i++];
			}
			if (token) tokens.push(token);
		}
	}

	return tokens;
}

export function parseLine(
	line: string,
	lineNumberBeforeMacroExpansion: number,
	lineNumberAfterMacroExpansion = lineNumberBeforeMacroExpansion
): ASTLine {
	try {
		const tokens = tokenizeInstruction(line);
		const [instruction = '', ...args] = tokens;
		const parsedArguments = args.map(parseArgument);
		validateInstructionArguments(instruction, parsedArguments);

		return {
			lineNumberBeforeMacroExpansion,
			lineNumberAfterMacroExpansion,
			instruction,
			arguments: parsedArguments,
			isSemanticOnly: isSemanticOnlyInstruction(instruction),
			isMemoryDeclaration: isMemoryDeclarationInstruction(instruction),
		};
	} catch (error) {
		if (error instanceof SyntaxRulesError) {
			throw new SyntaxRulesError(error.code, error.message, {
				...error.details,
				line,
				lineNumberBeforeMacroExpansion,
				lineNumberAfterMacroExpansion,
			});
		}
		throw error;
	}
}

export function compileToAST(code: string[], lineMetadata?: ParsedLineMetadata): AST {
	return code
		.map((line, index) => [index, line] as [number, string])
		.filter(([, line]) => !isComment(line))
		.filter(([, line]) => isValidInstruction(line))
		.map(([lineNumberAfterMacroExpansion, line]) => {
			const lineNumberBeforeMacroExpansion =
				lineMetadata?.[lineNumberAfterMacroExpansion]?.callSiteLineNumber ?? lineNumberAfterMacroExpansion;
			return parseLine(line, lineNumberBeforeMacroExpansion, lineNumberAfterMacroExpansion);
		});
}

export { instructionParser };

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseLine', () => {
		it('flags semantic-only instructions in generated AST lines', () => {
			expect(parseLine('const SIZE 16', 0).isSemanticOnly).toBe(true);
			expect(parseLine('use math', 0).isSemanticOnly).toBe(true);
			expect(parseLine('module demo', 0).isSemanticOnly).toBe(true);
			expect(parseLine('init value 1', 0).isSemanticOnly).toBe(true);
		});

		it('leaves runtime/codegen instructions unflagged', () => {
			expect(parseLine('push 1', 0).isSemanticOnly).toBe(false);
			expect(parseLine('int value 1', 0).isSemanticOnly).toBe(false);
		});

		it('rejects wrong arity and raw argument shape in tokenizer', () => {
			expect(() => parseLine('push', 0)).toThrowError(SyntaxRulesError);
			expect(() => parseLine('mapBegin bool', 0)).toThrowError(SyntaxRulesError);
			expect(() => parseLine('storeBytes -1', 0)).toThrowError(SyntaxRulesError);
			expect(() => parseLine('map "AB" 1', 0)).toThrowError(SyntaxRulesError);
		});
	});
}
