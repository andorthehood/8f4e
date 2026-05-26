import {
	ArgumentType,
	blockEndToStartInstruction,
	blockStartInstructions,
	isConstantsLine,
	isFunctionLine,
	isMemoryDeclarationLine,
	isModuleLine,
	isParamLine,
} from '@8f4e/compiler-spec';

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
	CompilerASTLine,
	CompilerASTLines,
	ConstantsLine,
	ExportLine,
	FunctionEndLine,
	FunctionLine,
	FunctionSignature,
	IfEndLine,
	IfBlockResultType,
	MemoryDeclarationLine,
	ModuleLine,
	ParsedLineMetadata,
	RegionLine,
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

type ASTCacheLookupResult<TAst> = {
	ast?: TAst;
	hash?: number;
};

type ModuleASTBuilder = {
	type: 'module';
	id: string;
	moduleLine: ModuleLine;
	regionLine?: RegionLine;
	memoryDeclarationLines: MemoryDeclarationLine[];
	referencedModuleIds: Set<string>;
};

type FunctionASTBuilder = {
	type: 'function';
	id: string;
	functionLine: FunctionLine;
	functionEndLine?: FunctionEndLine;
	parameters: FunctionSignature['parameters'];
	exportLine?: ExportLine;
	exportName?: string;
};

type ConstantsASTBuilder = {
	type: 'constants';
	id: string;
	constantsLine: ConstantsLine;
};

type SourceBlockASTBuilder = ModuleASTBuilder | FunctionASTBuilder | ConstantsASTBuilder;

type ParsedCompilerSource = {
	lines: CompilerASTLines;
	astBuilder?: SourceBlockASTBuilder;
};

const blockStartInstructionSet = new Set<BlockStartInstruction>(blockStartInstructions);
const sourceBlockStartInstructionSet = new Set(['module', 'function']);
const sourceBlockEndInstructionSet = new Set(['moduleEnd', 'functionEnd']);

function isBlockStartInstruction(instruction: string): instruction is BlockStartInstruction {
	return blockStartInstructionSet.has(instruction as BlockStartInstruction);
}

function isBlockEndInstruction(instruction: string): instruction is BlockEndInstruction {
	return Object.prototype.hasOwnProperty.call(blockEndToStartInstruction, instruction);
}

function canReferenceDeferredNamespace(instruction: string, isMemoryDeclaration: boolean): boolean {
	return isMemoryDeclaration || instruction === 'const' || instruction === 'use';
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

function getASTCacheLookupResult<TAst>(
	cached: ASTCacheEntry<TAst> | undefined,
	code: string[],
	lineMetadata: ParsedLineMetadata | undefined
): ASTCacheLookupResult<TAst> {
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

function addReferencedNamespaceIdsFromArgument(referencedNamespaceIds: Set<string>, argument: Argument): void {
	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		for (const moduleId of argument.intermoduleIds) {
			referencedNamespaceIds.add(moduleId);
		}
		return;
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return;
	}

	if (argument.scope === 'intermodule' && argument.targetModuleId) {
		referencedNamespaceIds.add(argument.targetModuleId);
	}
}

function isRegionLine(line: CompilerASTLine): line is RegionLine {
	return line.instruction === '#region';
}

function isExportLine(line: CompilerASTLine): line is ExportLine {
	return line.instruction === '#export';
}

function isFunctionEndLine(line: CompilerASTLine): line is FunctionEndLine {
	return line.instruction === 'functionEnd';
}

function createSourceBlockASTBuilder(line: CompilerASTLine): SourceBlockASTBuilder | undefined {
	if (isModuleLine(line)) {
		return {
			type: 'module',
			id: line.arguments[0].value,
			moduleLine: line,
			memoryDeclarationLines: [],
			referencedModuleIds: new Set<string>(),
		};
	}

	if (isFunctionLine(line)) {
		return {
			type: 'function',
			id: line.arguments[0].value,
			functionLine: line,
			parameters: [],
		};
	}

	if (isConstantsLine(line)) {
		return {
			type: 'constants',
			id: line.arguments[0].value,
			constantsLine: line,
		};
	}

	return undefined;
}

function applyModuleASTLine(builder: ModuleASTBuilder, line: CompilerASTLine): void {
	if (isRegionLine(line)) {
		builder.regionLine = line;
		return;
	}

	if (!isMemoryDeclarationLine(line)) {
		return;
	}

	builder.memoryDeclarationLines.push(line);
	for (const moduleId of line.referencedModuleIds ?? []) {
		builder.referencedModuleIds.add(moduleId);
	}
}

function applyFunctionASTLine(builder: FunctionASTBuilder, line: CompilerASTLine): void {
	if (isParamLine(line)) {
		builder.parameters.push(line.arguments[0].value as FunctionSignature['parameters'][number]);
		return;
	}

	if (isFunctionEndLine(line)) {
		builder.functionEndLine = line;
		return;
	}

	if (isExportLine(line)) {
		builder.exportLine = line;
		builder.exportName = builder.exportLine.arguments[0]?.value ?? builder.id;
	}
}

function applySourceBlockASTLine(builder: SourceBlockASTBuilder, line: CompilerASTLine): void {
	switch (builder.type) {
		case 'module':
			applyModuleASTLine(builder, line);
			return;
		case 'function':
			applyFunctionASTLine(builder, line);
			return;
		case 'constants':
			return;
	}
}

function createASTFromBuilder(lines: CompilerASTLines, builder: SourceBlockASTBuilder): AST {
	switch (builder.type) {
		case 'module':
			return {
				type: 'module',
				id: builder.id,
				lines,
				moduleLine: builder.moduleLine,
				...(builder.regionLine ? { regionLine: builder.regionLine } : {}),
				memoryDeclarationLines: builder.memoryDeclarationLines,
				referencedModuleIds: [...builder.referencedModuleIds],
			};
		case 'function':
			if (!builder.functionEndLine) {
				throw new SyntaxRulesError(SyntaxErrorCode.INVALID_BLOCK_STRUCTURE, 'Expected a matching functionEnd.', {
					lineNumberBeforeMacroExpansion: builder.functionLine.lineNumberBeforeMacroExpansion,
					lineNumberAfterMacroExpansion: builder.functionLine.lineNumberAfterMacroExpansion,
					instruction: builder.functionLine.instruction,
				});
			}

			return {
				type: 'function',
				id: builder.id,
				lines,
				functionLine: builder.functionLine,
				functionEndLine: builder.functionEndLine,
				signature: {
					parameters: builder.parameters,
					returns: builder.functionEndLine.arguments.map(arg => arg.value as FunctionSignature['returns'][number]),
				},
				...(builder.exportLine ? { exportLine: builder.exportLine, exportName: builder.exportName } : {}),
			};
		case 'constants':
			return {
				type: 'constants',
				id: builder.id,
				lines,
				constantsLine: builder.constantsLine,
			};
	}
}

function toAST(parsedSource: ParsedCompilerSource): AST {
	const { lines, astBuilder } = parsedSource;
	const firstLine = lines[0];

	if (astBuilder) {
		return createASTFromBuilder(lines, astBuilder);
	}

	throw new SyntaxRulesError(SyntaxErrorCode.INVALID_BLOCK_STRUCTURE, 'Expected a compiler source block.', {
		lineNumberBeforeMacroExpansion: firstLine?.lineNumberBeforeMacroExpansion ?? 0,
		lineNumberAfterMacroExpansion: firstLine?.lineNumberAfterMacroExpansion ?? 0,
		instruction: firstLine?.instruction,
	});
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
		const isMemoryDeclaration = isMemoryDeclarationInstruction(instruction);
		const shouldRecordNamespaceReferences = canReferenceDeferredNamespace(instruction, isMemoryDeclaration);
		const parsedArguments: Argument[] = [];
		const referencedNamespaceIds = new Set<string>();
		for (const arg of args) {
			const parsedArgument = parseArgument(arg);
			parsedArguments.push(parsedArgument);
			if (shouldRecordNamespaceReferences) {
				addReferencedNamespaceIdsFromArgument(referencedNamespaceIds, parsedArgument);
			}
		}
		validateInstructionArguments(instruction, parsedArguments);
		const [useArgument] = parsedArguments;
		if (shouldRecordNamespaceReferences && instruction === 'use' && useArgument?.type === ArgumentType.IDENTIFIER) {
			referencedNamespaceIds.add(useArgument.value);
		}
		const parsedLine = {
			lineNumberBeforeMacroExpansion,
			lineNumberAfterMacroExpansion,
			instruction,
			arguments: parsedArguments,
			isSemanticOnly: isSemanticOnlyInstruction(instruction),
			isMemoryDeclaration,
			...(referencedNamespaceIds.size > 0 ? { referencedNamespaceIds: [...referencedNamespaceIds] } : {}),
		} as ASTLine;

		if (isMemoryDeclaration) {
			const memoryLine = parsedLine as MemoryDeclarationLine;
			memoryLine.hasExplicitMemoryDefault = hasExplicitMemoryDefault(instruction, parsedArguments);
			if (referencedNamespaceIds.size > 0) {
				memoryLine.referencedModuleIds = [...referencedNamespaceIds];
			}
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

function parseCompilerSource(code: string[], lineMetadata?: ParsedLineMetadata): ParsedCompilerSource {
	const ast: CompilerASTLines = [];
	let astBuilder: SourceBlockASTBuilder | undefined;
	let onlySemanticLinesBeforeSourceBlock = true;
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
		const isFirstASTLine = ast.length === 0;
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
		if (!astBuilder) {
			const candidateBuilder = createSourceBlockASTBuilder(parsedLine);
			if (
				candidateBuilder &&
				(isFirstASTLine || (candidateBuilder.type === 'function' && onlySemanticLinesBeforeSourceBlock))
			) {
				astBuilder = candidateBuilder;
			}
		}
		if (astBuilder) {
			applySourceBlockASTLine(astBuilder, parsedLine);
		} else if (!parsedLine.isSemanticOnly) {
			onlySemanticLinesBeforeSourceBlock = false;
		}

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

	return { lines: ast, astBuilder };
}

export function compileToASTLines(
	code: string[],
	lineMetadata?: ParsedLineMetadata,
	cache?: ASTCache<CompilerASTLines>,
	cacheKey?: string
): CompilerASTLines {
	const cached = cacheKey !== undefined ? cache?.entries.get(cacheKey) : undefined;
	const cachedLookup = getASTCacheLookupResult(cached, code, lineMetadata);
	if (cachedLookup.ast) {
		cache!.stats.hits++;
		return cachedLookup.ast;
	}
	if (cache && cacheKey !== undefined) {
		cache.stats.misses++;
	}

	const ast = parseCompilerSource(code, lineMetadata).lines;

	if (cache && cacheKey !== undefined) {
		const entry: ASTCacheEntry<CompilerASTLines> = {
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

export function compileToAST(
	code: string[],
	lineMetadata?: ParsedLineMetadata,
	cache?: ASTCache<AST>,
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

	const parsedSource = parseCompilerSource(code, lineMetadata);
	const group = toAST(parsedSource);

	if (cache && cacheKey !== undefined) {
		const entry: ASTCacheEntry<AST> = {
			ast: group,
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

	return group;
}

export { instructionParser };
