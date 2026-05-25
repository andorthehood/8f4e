import { ArgumentType, blockEndToStartInstruction, blockStartInstructions } from '@8f4e/compiler-spec';

import instructionParser from './syntax/instructionParser';
import isArrayDeclarationInstruction from './syntax/isArrayDeclarationInstruction';
import isComment from './syntax/isComment';
import isMemoryDeclarationInstruction from './syntax/isMemoryDeclarationInstruction';
import isSemanticOnlyInstruction from './syntax/isSemanticOnlyInstruction';
import isValidInstruction from './syntax/isValidInstruction';
import { parseArgument } from './syntax/parseArgument';
import { SyntaxRulesError, SyntaxErrorCode } from './syntax/syntaxError';
import validateInstructionArguments from './syntax/validateInstructionArguments';
import { hashSource } from './cache';

import type {
	AST,
	ASTCache,
	ASTCacheEntry,
	ASTLine,
	Argument,
	BlockEndLine,
	BlockEndInstruction,
	BlockStartInstruction,
	BlockBlockResultType,
	IfEndLine,
	IfBlockResultType,
	ParsedLineMetadata,
} from '@8f4e/compiler-spec';

type OpenBlock = {
	instruction: BlockStartInstruction;
	astIndex: number;
	hasElse?: boolean;
};

type SourceBlockPrologue = {
	instruction: 'module' | 'function';
	blockDepth: number;
	isOpen: boolean;
};

type ASTCacheLookupResult = {
	ast?: AST;
	hash?: number;
};

const blockStartInstructionSet = new Set<BlockStartInstruction>(blockStartInstructions);
const sourceBlockStartInstructionSet = new Set(['module', 'function']);
const sourceBlockEndInstructionSet = new Set(['moduleEnd', 'functionEnd']);

function isBlockStartInstruction(instruction: string): instruction is BlockStartInstruction {
	return blockStartInstructionSet.has(instruction as BlockStartInstruction);
}

function isBlockEndInstruction(instruction: string): instruction is BlockEndInstruction {
	return instruction in blockEndToStartInstruction;
}

function isCompilerDirectiveInstruction(instruction: string): boolean {
	return instruction.startsWith('#');
}

function getResultTypeFromFirstArgument(line: IfEndLine | BlockEndLine): IfBlockResultType {
	return (line.arguments[0]?.value ?? null) as IfBlockResultType;
}

function getIfResultType(line: IfEndLine): IfBlockResultType {
	return getResultTypeFromFirstArgument(line);
}

function getBlockEndResultType(line: BlockEndLine): BlockBlockResultType {
	return getResultTypeFromFirstArgument(line);
}

function hasExplicitMemoryDefault(instruction: string, args: Array<Argument>): boolean | undefined {
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

function getASTCacheLookupResult(
	cached: ASTCacheEntry | undefined,
	code: string[],
	lineMetadata: ParsedLineMetadata | undefined
): ASTCacheLookupResult {
	// Optimize first compilation and obvious cache misses: only hash when an existing same-line-count entry needs validation.
	if (!cached || cached.lineCount !== code.length) {
		return {};
	}

	const hash = hashSource(code, lineMetadata);
	const cachedHash =
		cached.hash ?? (cached.hashInput ? hashSource(cached.hashInput.code, cached.hashInput.lineMetadata) : undefined);

	if (cachedHash === undefined) {
		return { hash };
	}

	cached.hash = cachedHash;
	cached.hashInput = undefined;
	return {
		ast: cachedHash === hash ? cached.ast : undefined,
		hash,
	};
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
		const parsedLine = {
			lineNumberBeforeMacroExpansion,
			lineNumberAfterMacroExpansion,
			instruction,
			arguments: parsedArguments,
			isSemanticOnly: isSemanticOnlyInstruction(instruction),
			isMemoryDeclaration,
		} as ASTLine;

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
	const cached = cacheKey !== undefined ? cache?.entries.get(cacheKey) : undefined;
	const cachedLookup = getASTCacheLookupResult(cached, code, lineMetadata);
	if (cachedLookup.ast) {
		cache!.stats.hits++;
		return cachedLookup.ast;
	}
	if (cache && cacheKey !== undefined) {
		cache.stats.misses++;
	}

	const ast: AST = [];
	const blockStack: OpenBlock[] = [];
	const sourceBlockPrologueStack: SourceBlockPrologue[] = [];

	for (const [lineNumberAfterMacroExpansion, line] of code.map((sourceLine, index) => [index, sourceLine] as const)) {
		if (isComment(line) || !isValidInstruction(line)) {
			continue;
		}

		const lineNumberBeforeMacroExpansion =
			lineMetadata?.[lineNumberAfterMacroExpansion]?.callSiteLineNumber ?? lineNumberAfterMacroExpansion;
		const parsedLine = parseLine(line, lineNumberBeforeMacroExpansion, lineNumberAfterMacroExpansion);
		const astIndex = ast.length;
		const currentSourceBlockPrologue = sourceBlockPrologueStack[sourceBlockPrologueStack.length - 1];
		const isCompilerDirective = isCompilerDirectiveInstruction(parsedLine.instruction);
		const isInOpenSourceBlockPrologue =
			currentSourceBlockPrologue?.isOpen && currentSourceBlockPrologue.blockDepth === blockStack.length;

		if (isCompilerDirective && isInOpenSourceBlockPrologue) {
			parsedLine.isBlockPrologue = true;
		} else if (isCompilerDirective) {
			throw new SyntaxRulesError(SyntaxErrorCode.COMPILER_DIRECTIVE_MUST_BE_PROLOGUE, undefined, {
				lineNumberBeforeMacroExpansion,
				lineNumberAfterMacroExpansion,
				instruction: parsedLine.instruction,
			});
		}

		if (isInOpenSourceBlockPrologue && !isCompilerDirective) {
			currentSourceBlockPrologue.isOpen = false;
		}

		ast.push(parsedLine);

		if (isBlockStartInstruction(parsedLine.instruction)) {
			blockStack.push({
				instruction: parsedLine.instruction,
				astIndex,
				hasElse: parsedLine.instruction === 'if' ? false : undefined,
			});

			if (sourceBlockStartInstructionSet.has(parsedLine.instruction)) {
				sourceBlockPrologueStack.push({
					instruction: parsedLine.instruction as 'module' | 'function',
					blockDepth: blockStack.length,
					isOpen: true,
				});
			}
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

		if (!isBlockEndInstruction(parsedLine.instruction)) {
			continue;
		}

		const endInstruction = parsedLine.instruction;
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

		if (sourceBlockEndInstructionSet.has(endInstruction)) {
			sourceBlockPrologueStack.pop();
		}

		if (endInstruction !== 'ifEnd' && endInstruction !== 'blockEnd') {
			continue;
		}

		if (parsedLine.instruction === 'ifEnd') {
			const resultType = getIfResultType(parsedLine as IfEndLine);
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
			const resultType = getBlockEndResultType(parsedLine as BlockEndLine);
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

	if (cache && cacheKey !== undefined) {
		const entry: ASTCacheEntry = {
			ast,
			hashInput: {
				code,
				lineMetadata,
			},
			lineCount: code.length,
		};
		if (cachedLookup.hash !== undefined) {
			entry.hash = cachedLookup.hash;
			entry.hashInput = undefined;
		}
		cache.entries.set(cacheKey, entry);
	}

	return ast;
}

export { instructionParser };
