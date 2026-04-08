import instructionParser from './syntax/instructionParser';
import isComment from './syntax/isComment';
import isMemoryDeclarationInstruction from './syntax/isMemoryDeclarationInstruction';
import isSemanticOnlyInstruction from './syntax/isSemanticOnlyInstruction';
import isValidInstruction from './syntax/isValidInstruction';
import { ArgumentType, parseArgument } from './syntax/parseArgument';
import { SyntaxRulesError, SyntaxErrorCode } from './syntax/syntaxError';
import validateInstructionArguments from './syntax/validateInstructionArguments';

import type { AST, ASTLine, IfBlockResultType, ParsedLineMetadata } from './types';

type BlockStartInstruction = 'if' | 'block' | 'loop' | 'function' | 'module' | 'constants' | 'mapBegin';
type BlockEndInstruction = 'ifEnd' | 'blockEnd' | 'loopEnd' | 'functionEnd' | 'moduleEnd' | 'constantsEnd' | 'mapEnd';

type OpenBlock = {
	instruction: BlockStartInstruction;
	astIndex: number;
	hasElse?: boolean;
};

const blockStartInstructions = new Set<BlockStartInstruction>([
	'if',
	'block',
	'loop',
	'function',
	'module',
	'constants',
	'mapBegin',
]);

const blockEndToStartInstruction: Record<BlockEndInstruction, BlockStartInstruction> = {
	ifEnd: 'if',
	blockEnd: 'block',
	loopEnd: 'loop',
	functionEnd: 'function',
	moduleEnd: 'module',
	constantsEnd: 'constants',
	mapEnd: 'mapBegin',
};

function getIfResultType(line: ASTLine): IfBlockResultType {
	const typeArgument = line.arguments[0];

	if (!typeArgument || typeArgument.type !== ArgumentType.IDENTIFIER) {
		return null;
	}

	return typeArgument.value === 'int' || typeArgument.value === 'float' ? typeArgument.value : null;
}

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
	const ast: AST = [];
	const blockStack: OpenBlock[] = [];

	for (const [lineNumberAfterMacroExpansion, line] of code.map((sourceLine, index) => [index, sourceLine] as const)) {
		if (isComment(line) || !isValidInstruction(line)) {
			continue;
		}

		const lineNumberBeforeMacroExpansion =
			lineMetadata?.[lineNumberAfterMacroExpansion]?.callSiteLineNumber ?? lineNumberAfterMacroExpansion;
		const parsedLine = parseLine(line, lineNumberBeforeMacroExpansion, lineNumberAfterMacroExpansion);
		const astIndex = ast.length;

		ast.push(parsedLine);

		if (blockStartInstructions.has(parsedLine.instruction as BlockStartInstruction)) {
			blockStack.push({
				instruction: parsedLine.instruction as BlockStartInstruction,
				astIndex,
				hasElse: parsedLine.instruction === 'if' ? false : undefined,
			});
			continue;
		}

		if (parsedLine.instruction === 'else') {
			const openBlock = blockStack[blockStack.length - 1];

			if (!openBlock || openBlock.instruction !== 'if') {
				throw new SyntaxRulesError(
					SyntaxErrorCode.INVALID_BLOCK_STRUCTURE,
					'Unexpected else without a matching open if block.',
					{
						line,
						lineNumberBeforeMacroExpansion,
						lineNumberAfterMacroExpansion,
					}
				);
			}

			if (openBlock.hasElse) {
				throw new SyntaxRulesError(
					SyntaxErrorCode.INVALID_BLOCK_STRUCTURE,
					'Unexpected else: if blocks may only contain one else branch.',
					{
						line,
						lineNumberBeforeMacroExpansion,
						lineNumberAfterMacroExpansion,
					}
				);
			}

			openBlock.hasElse = true;
			continue;
		}

		if (!(parsedLine.instruction in blockEndToStartInstruction)) {
			continue;
		}

		const endInstruction = parsedLine.instruction as BlockEndInstruction;
		const expectedStartInstruction = blockEndToStartInstruction[endInstruction];
		const openBlock = blockStack.pop();

		if (!openBlock) {
			throw new SyntaxRulesError(
				SyntaxErrorCode.INVALID_BLOCK_STRUCTURE,
				`Unexpected ${endInstruction} without a matching open ${expectedStartInstruction} block.`,
				{
					line,
					lineNumberBeforeMacroExpansion,
					lineNumberAfterMacroExpansion,
				}
			);
		}

		if (openBlock.instruction !== expectedStartInstruction) {
			throw new SyntaxRulesError(
				SyntaxErrorCode.INVALID_BLOCK_STRUCTURE,
				`Unexpected ${endInstruction}: expected ${openBlock.instruction} to be closed before ending ${expectedStartInstruction}.`,
				{
					line,
					lineNumberBeforeMacroExpansion,
					lineNumberAfterMacroExpansion,
					openInstruction: openBlock.instruction,
					openLineNumberBeforeMacroExpansion: ast[openBlock.astIndex].lineNumberBeforeMacroExpansion,
					openLineNumberAfterMacroExpansion: ast[openBlock.astIndex].lineNumberAfterMacroExpansion,
				}
			);
		}

		if (endInstruction !== 'ifEnd') {
			continue;
		}

		const resultType = getIfResultType(parsedLine);
		ast[openBlock.astIndex].ifBlock = {
			matchingIfEndIndex: astIndex,
			resultType,
			hasElse: Boolean(openBlock.hasElse),
		};
		parsedLine.ifEndBlock = {
			matchingIfIndex: openBlock.astIndex,
			resultType,
		};
	}

	if (blockStack.length > 0) {
		const openBlock = blockStack[blockStack.length - 1];
		const openLine = ast[openBlock.astIndex];

		throw new SyntaxRulesError(SyntaxErrorCode.INVALID_BLOCK_STRUCTURE, `Unclosed ${openBlock.instruction} block.`, {
			lineNumberBeforeMacroExpansion: openLine.lineNumberBeforeMacroExpansion,
			lineNumberAfterMacroExpansion: openLine.lineNumberAfterMacroExpansion,
			openInstruction: openBlock.instruction,
		});
	}

	return ast;
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

	describe('compileToAST', () => {
		it('pairs if with ifEnd metadata without rewriting source arguments', () => {
			const ast = compileToAST(['push 1', 'if', 'push 10', 'ifEnd int']);

			expect(ast[1]).toMatchObject({
				instruction: 'if',
				arguments: [],
				ifBlock: {
					matchingIfEndIndex: 3,
					resultType: 'int',
					hasElse: false,
				},
			});
			expect(ast[3]).toMatchObject({
				instruction: 'ifEnd',
				ifEndBlock: {
					matchingIfIndex: 1,
					resultType: 'int',
				},
			});
		});

		it('tracks else on the paired if metadata', () => {
			const ast = compileToAST(['push 1', 'if', 'push 10', 'else', 'push 20', 'ifEnd']);

			expect(ast[1].ifBlock).toMatchObject({
				matchingIfEndIndex: 5,
				resultType: null,
				hasElse: true,
			});
		});

		it('rejects else without an open if block', () => {
			expect(() => compileToAST(['else'])).toThrowError(SyntaxRulesError);
		});

		it('rejects unclosed if blocks', () => {
			expect(() => compileToAST(['push 1', 'if', 'push 10'])).toThrowError(SyntaxRulesError);
		});
	});
}
