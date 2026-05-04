import instructionParser from './syntax/instructionParser';
import isArrayDeclarationInstruction from './syntax/isArrayDeclarationInstruction';
import isComment from './syntax/isComment';
import isMemoryDeclarationInstruction from './syntax/isMemoryDeclarationInstruction';
import isSemanticOnlyInstruction from './syntax/isSemanticOnlyInstruction';
import isValidInstruction from './syntax/isValidInstruction';
import { ArgumentType, parseArgument } from './syntax/parseArgument';
import { SyntaxRulesError, SyntaxErrorCode } from './syntax/syntaxError';
import validateInstructionArguments from './syntax/validateInstructionArguments';
import { hashSource } from './cache';

import type { AST, ASTLine, BlockBlockResultType, IfBlockResultType, ParsedLineMetadata } from './types';
import type { ASTCache } from './cache';

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

function getResultTypeFromFirstArgument(line: ASTLine): IfBlockResultType {
	const typeArgument = line.arguments[0];

	if (!typeArgument || typeArgument.type !== ArgumentType.IDENTIFIER) {
		return null;
	}

	return typeArgument.value === 'int' || typeArgument.value === 'float' ? typeArgument.value : null;
}

function getIfResultType(line: ASTLine): IfBlockResultType {
	return getResultTypeFromFirstArgument(line);
}

function getBlockEndResultType(line: ASTLine): BlockBlockResultType {
	return getResultTypeFromFirstArgument(line);
}

function hasExplicitMemoryDefault(instruction: string, args: ASTLine['arguments']): boolean | undefined {
	if (!isMemoryDeclarationInstruction(instruction)) {
		return undefined;
	}

	if (isArrayDeclarationInstruction(instruction)) {
		return args.length > 2;
	}

	if (args.length === 0) {
		return false;
	}

	const firstArg = args[0];
	if (firstArg.type !== ArgumentType.IDENTIFIER) {
		return true;
	}
	if (firstArg.referenceKind === 'constant') {
		return true;
	}
	return args.length > 1;
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
	let instruction: string | undefined;
	try {
		const tokens = tokenizeInstruction(line);
		const [first = '', ...args] = tokens;
		instruction = first;
		const parsedArguments = args.map(parseArgument);
		validateInstructionArguments(instruction, parsedArguments);
		const isMemoryDeclaration = isMemoryDeclarationInstruction(instruction);
		const parsedLine: ASTLine = {
			lineNumberBeforeMacroExpansion,
			lineNumberAfterMacroExpansion,
			instruction,
			arguments: parsedArguments,
			isSemanticOnly: isSemanticOnlyInstruction(instruction),
			isMemoryDeclaration,
		};

		if (isMemoryDeclaration) {
			parsedLine.hasExplicitMemoryDefault = hasExplicitMemoryDefault(instruction, parsedArguments);
		}

		return parsedLine;
	} catch (error) {
		if (error instanceof SyntaxRulesError) {
			throw new SyntaxRulesError(error.code, error.message, {
				lineNumberBeforeMacroExpansion,
				lineNumberAfterMacroExpansion,
				// instruction is undefined only if tokenizeInstruction threw before assignment
				instruction: instruction ?? undefined,
			});
		}
		throw error;
	}
}

export function compileToAST(
	code: string[],
	lineMetadata?: ParsedLineMetadata,
	cache?: ASTCache,
	cacheKey?: string
): AST {
	const hash = cache && cacheKey !== undefined ? hashSource(code, lineMetadata) : undefined;
	const cached = cacheKey !== undefined ? cache?.entries.get(cacheKey) : undefined;
	if (cached && hash !== undefined && cached.hash === hash) {
		cache!.stats.hits++;
		return cached.ast;
	}
	if (cache && cacheKey !== undefined) {
		cache.stats.misses++;
	}

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
						lineNumberBeforeMacroExpansion,
						lineNumberAfterMacroExpansion,
						instruction: parsedLine.instruction,
					}
				);
			}

			if (openBlock.hasElse) {
				throw new SyntaxRulesError(
					SyntaxErrorCode.INVALID_BLOCK_STRUCTURE,
					'Unexpected else: if blocks may only contain one else branch.',
					{
						lineNumberBeforeMacroExpansion,
						lineNumberAfterMacroExpansion,
						instruction: parsedLine.instruction,
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
					lineNumberBeforeMacroExpansion,
					lineNumberAfterMacroExpansion,
					instruction: parsedLine.instruction,
				}
			);
		}

		if (openBlock.instruction !== expectedStartInstruction) {
			throw new SyntaxRulesError(
				SyntaxErrorCode.INVALID_BLOCK_STRUCTURE,
				`Unexpected ${endInstruction}: expected ${openBlock.instruction} to be closed before ending ${expectedStartInstruction}.`,
				{
					lineNumberBeforeMacroExpansion,
					lineNumberAfterMacroExpansion,
					instruction: parsedLine.instruction,
				}
			);
		}

		if (endInstruction !== 'ifEnd' && endInstruction !== 'blockEnd') {
			continue;
		}

		if (endInstruction === 'ifEnd') {
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
		} else {
			const resultType = getBlockEndResultType(parsedLine);
			ast[openBlock.astIndex].blockBlock = {
				matchingBlockEndIndex: astIndex,
				resultType,
			};
			parsedLine.blockEndBlock = {
				matchingBlockIndex: openBlock.astIndex,
				resultType,
			};
		}
	}

	if (blockStack.length > 0) {
		const openBlock = blockStack[blockStack.length - 1];
		const openLine = ast[openBlock.astIndex];

		throw new SyntaxRulesError(SyntaxErrorCode.INVALID_BLOCK_STRUCTURE, `Unclosed ${openBlock.instruction} block.`, {
			lineNumberBeforeMacroExpansion: openLine.lineNumberBeforeMacroExpansion,
			lineNumberAfterMacroExpansion: openLine.lineNumberAfterMacroExpansion,
			instruction: openBlock.instruction,
		});
	}

	if (cache && cacheKey !== undefined && hash !== undefined) {
		cache.entries.set(cacheKey, { hash, ast });
	}

	return ast;
}

export { instructionParser };
