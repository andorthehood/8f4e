import type {
	Argument,
	AST,
	ASTCache,
	ASTCacheEntry,
	BlockEndInstruction,
	BlockEndLine,
	BlockLine,
	BlockResultTypes,
	BlockStartInstruction,
	CompilerASTLine,
	CompilerASTLines,
	ConstantsLine,
	ExportLine,
	FunctionEndLine,
	FunctionLine,
	FunctionSignature,
	IfEndLine,
	IfLine,
	ImportLine,
	MemoryDeclarationLine,
	ModuleLine,
	PrototypeLine,
	RegionLine,
} from '@8f4e/compiler-spec';
import {
	ArgumentType,
	blockEndToStartInstruction,
	blockStartInstructions,
	compilerSourceBlockInstructionPairs,
	DEFAULT_HOST_IMPORT_MODULE_NAME,
	getInstructionSpec,
	isCompilerDirectiveLine,
	isMemoryDeclarationLine,
	isSemanticInstructionLine,
} from '@8f4e/compiler-spec';
import { hashSource } from './cache';
import instructionParser from './syntax/instructionParser';
import isArrayDeclarationInstruction from './syntax/isArrayDeclarationInstruction';
import isComment from './syntax/isComment';
import isInstructionLikeLine from './syntax/isInstructionLikeLine';
import isMemoryDeclarationInstruction from './syntax/isMemoryDeclarationInstruction';
import { parseArgument } from './syntax/parseArgument';
import { SyntaxErrorCode, SyntaxRulesError } from './syntax/syntaxError';
import validateInstructionArguments from './syntax/validateInstructionArguments';

type IfOpenBlock = {
	instruction: 'if';
	astIndex: number;
	line: IfLine;
	hasElse: boolean;
};

type GenericOpenBlock = {
	instruction: 'block';
	astIndex: number;
	line: BlockLine;
};

type OtherOpenBlock = {
	instruction: Exclude<BlockStartInstruction, 'if' | 'block'>;
	astIndex: number;
};

type OpenBlock = IfOpenBlock | GenericOpenBlock | OtherOpenBlock;

type SourceBlockPrologue = {
	instruction: (typeof compilerSourceBlockInstructionPairs)[number]['start'];
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
};

type FunctionASTBuilder = {
	type: 'function';
	id: string;
	functionLine: FunctionLine;
	functionEndLine?: FunctionEndLine;
	parameters: FunctionSignature['parameters'];
	exportLine?: ExportLine;
	exportName?: string;
	importLine?: ImportLine;
	import?: {
		moduleName: string;
		fieldName: string;
	};
};

type ConstantsASTBuilder = {
	type: 'constants';
	id: string;
	constantsLine: ConstantsLine;
};

type PrototypeASTBuilder = {
	type: 'prototype';
	id: string;
	prototypeLine: PrototypeLine;
	memoryDeclarationLines: MemoryDeclarationLine[];
};

type SourceBlockASTBuilder = ModuleASTBuilder | FunctionASTBuilder | ConstantsASTBuilder | PrototypeASTBuilder;

type ParsedCompilerSource = {
	lines: CompilerASTLines;
	astBuilder?: SourceBlockASTBuilder;
};

type SourceLine = {
	line: string;
	lineNumber: number;
};

const blockStartInstructionSet = new Set<BlockStartInstruction>(blockStartInstructions);
const sourceBlockStartInstructionSet: ReadonlySet<string> = new Set(
	compilerSourceBlockInstructionPairs.map(({ start }) => start)
);
const sourceBlockEndInstructionSet: ReadonlySet<string> = new Set(
	compilerSourceBlockInstructionPairs.map(({ end }) => end)
);

function isBlockStartInstruction(instruction: string): instruction is BlockStartInstruction {
	return blockStartInstructionSet.has(instruction as BlockStartInstruction);
}

function isBlockEndInstruction(instruction: string): instruction is BlockEndInstruction {
	return Object.hasOwn(blockEndToStartInstruction, instruction);
}

function validateShapeSourceBlockScope(line: CompilerASTLine, sourceBlock: SourceBlockPrologue | undefined): void {
	if (line.instruction !== 'shape') {
		return;
	}

	const scope = getInstructionSpec(line.instruction)?.scope;
	if (scope !== 'module' || sourceBlock?.instruction !== scope) {
		throw new SyntaxRulesError(SyntaxErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, undefined, {
			lineNumber: line.lineNumber,
			instruction: line.instruction,
		});
	}
}

function getResultTypesFromArguments(line: IfEndLine | BlockEndLine): BlockResultTypes {
	return line.arguments.map(argument => argument.value as BlockResultTypes[number]);
}

function hasExplicitMemoryDefault(instruction: string, args: Array<Argument>): boolean {
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
	code: string[]
): ASTCacheLookupResult<TAst> {
	// Optimize first compilation and obvious cache misses: only hash when an existing same-line-count entry needs validation.
	if (!cached || cached.lineCount !== code.length) {
		return {};
	}

	const hash = hashSource(code);
	const cachedHash = cached.hash ?? (cached.hashInput ? hashSource(cached.hashInput.code) : undefined);

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

function createSourceBlockASTBuilder(line: CompilerASTLine): SourceBlockASTBuilder | undefined {
	switch (line.instruction) {
		case 'module':
			return {
				type: 'module',
				id: line.arguments[0].value,
				moduleLine: line,
				memoryDeclarationLines: [],
			};
		case 'function':
			return {
				type: 'function',
				id: line.arguments[0].value,
				functionLine: line,
				parameters: [],
			};
		case 'constants':
			return {
				type: 'constants',
				id: line.arguments[0].value,
				constantsLine: line,
			};
		case 'prototype':
			return {
				type: 'prototype',
				id: line.arguments[0].value,
				prototypeLine: line,
				memoryDeclarationLines: [],
			};
		default:
			return undefined;
	}
}

function applyModuleASTLine(builder: ModuleASTBuilder, line: CompilerASTLine): void {
	switch (line.instruction) {
		case '#region':
			builder.regionLine = line;
			return;
		default:
			if (!isMemoryDeclarationLine(line)) {
				return;
			}
	}

	builder.memoryDeclarationLines.push(line);
}

function applyFunctionASTLine(builder: FunctionASTBuilder, line: CompilerASTLine): void {
	switch (line.instruction) {
		case 'param':
			builder.parameters.push(line.arguments[0].value as FunctionSignature['parameters'][number]);
			return;
		case 'functionEnd':
			builder.functionEndLine = line;
			return;
		case '#export':
			builder.exportLine = line;
			builder.exportName = builder.exportLine.arguments[0]?.value ?? builder.id;
			return;
		case '#import':
			builder.importLine = line;
			builder.import = {
				moduleName: DEFAULT_HOST_IMPORT_MODULE_NAME,
				fieldName: line.arguments[0].value,
			};
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
		case 'prototype':
			if (isMemoryDeclarationLine(line)) {
				builder.memoryDeclarationLines.push(line);
			}
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
			};
		case 'function':
			if (!builder.functionEndLine) {
				throw new SyntaxRulesError(SyntaxErrorCode.INVALID_BLOCK_STRUCTURE, 'Expected a matching functionEnd.', {
					lineNumber: builder.functionLine.lineNumber,
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
				...(builder.importLine ? { importLine: builder.importLine, import: builder.import } : {}),
			};
		case 'constants':
			return {
				type: 'constants',
				id: builder.id,
				lines,
				constantsLine: builder.constantsLine,
			};
		case 'prototype':
			return {
				type: 'prototype',
				id: builder.id,
				lines,
				prototypeLine: builder.prototypeLine,
				memoryDeclarationLines: builder.memoryDeclarationLines,
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
		lineNumber: firstLine?.lineNumber ?? 0,
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

function withSyntaxLine(error: SyntaxRulesError, lineNumber: number, instruction?: string): SyntaxRulesError {
	return new SyntaxRulesError(error.code, error.message, {
		lineNumber,
		instruction,
	});
}

function parseInstructionTokens(line: string, lineNumber: number): string[] {
	try {
		return tokenizeInstruction(line);
	} catch (error) {
		if (error instanceof SyntaxRulesError) {
			throw withSyntaxLine(error, lineNumber);
		}
		throw error;
	}
}

function isArgumentContinuationCandidate(line: string): boolean {
	return /^\s*-(?=\s|;|$)/.test(line);
}

function foldArgumentContinuationLines(code: string[]): SourceLine[] {
	const sourceLines: SourceLine[] = [];
	let previousSourceLine: SourceLine | undefined;

	for (const [lineNumber, line] of code.map((sourceLine, index) => [index, sourceLine] as const)) {
		if (isComment(line) || !isInstructionLikeLine(line)) {
			continue;
		}

		if (!isArgumentContinuationCandidate(line)) {
			const sourceLine = {
				line,
				lineNumber,
			};
			sourceLines.push(sourceLine);
			previousSourceLine = sourceLine;
			continue;
		}

		const tokens = parseInstructionTokens(line, lineNumber);
		const instruction = '-';

		if (!previousSourceLine) {
			throw new SyntaxRulesError(SyntaxErrorCode.INVALID_ARGUMENT, 'Argument continuation has no instruction.', {
				lineNumber,
				instruction,
			});
		}

		if (tokens.length < 2) {
			throw new SyntaxRulesError(SyntaxErrorCode.MISSING_ARGUMENT, 'Missing argument for continuation.', {
				lineNumber,
				instruction,
			});
		}

		if (tokens.length > 2) {
			throw new SyntaxRulesError(
				SyntaxErrorCode.INVALID_ARGUMENT,
				'Argument continuation accepts exactly one argument.',
				{
					lineNumber,
					instruction,
				}
			);
		}

		previousSourceLine.line = `${previousSourceLine.line} ${tokens[1]}`;
	}

	return sourceLines;
}

export function parseLine(line: string, lineNumber: number): CompilerASTLine {
	let instruction: string | undefined;
	try {
		const tokens = tokenizeInstruction(line);
		const [first = '', ...args] = tokens;
		instruction = first;
		const isMemoryDeclaration = isMemoryDeclarationInstruction(instruction);
		const shouldRecordNamespaceReferences = isMemoryDeclaration || instruction === 'const' || instruction === 'use';
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
			lineNumber,
			instruction,
			arguments: parsedArguments,
			...(referencedNamespaceIds.size > 0 ? { referencedNamespaceIds: [...referencedNamespaceIds] } : {}),
		} as CompilerASTLine;

		if (isMemoryDeclarationLine(parsedLine)) {
			const memoryLine: MemoryDeclarationLine = parsedLine;
			memoryLine.hasExplicitMemoryDefault = hasExplicitMemoryDefault(instruction, parsedArguments);
		}

		return parsedLine;
	} catch (error) {
		if (error instanceof SyntaxRulesError) {
			throw withSyntaxLine(
				error,
				lineNumber,
				// instruction is undefined only if tokenizeInstruction threw before assignment
				instruction ?? undefined
			);
		}
		throw error;
	}
}

function parseCompilerSource(code: string[]): ParsedCompilerSource {
	const ast: CompilerASTLines = [];
	let astBuilder: SourceBlockASTBuilder | undefined;
	let onlySemanticLinesBeforeSourceBlock = true;
	const blockStack: OpenBlock[] = [];
	const sourceBlockPrologueStack: SourceBlockPrologue[] = [];
	const sourceLines = foldArgumentContinuationLines(code);

	for (const { line, lineNumber } of sourceLines) {
		const parsedLine = parseLine(line, lineNumber);
		const astIndex = ast.length;
		const isFirstASTLine = ast.length === 0;
		const currentSourceBlockPrologue = sourceBlockPrologueStack[sourceBlockPrologueStack.length - 1];
		const isCompilerDirective = isCompilerDirectiveLine(parsedLine);
		const isInOpenSourceBlockPrologue =
			currentSourceBlockPrologue?.isOpen && currentSourceBlockPrologue.blockDepth === blockStack.length;

		if (isCompilerDirective && isInOpenSourceBlockPrologue) {
			parsedLine.isBlockPrologue = true;
		} else if (isCompilerDirective) {
			throw new SyntaxRulesError(SyntaxErrorCode.COMPILER_DIRECTIVE_MUST_BE_PROLOGUE, undefined, {
				lineNumber,
				instruction: parsedLine.instruction,
			});
		}

		if (isInOpenSourceBlockPrologue && !isCompilerDirective) {
			currentSourceBlockPrologue.isOpen = false;
		}

		if (currentSourceBlockPrologue?.instruction === 'function' && isMemoryDeclarationLine(parsedLine)) {
			throw new SyntaxRulesError(SyntaxErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, undefined, {
				lineNumber,
				instruction: parsedLine.instruction,
			});
		}
		validateShapeSourceBlockScope(parsedLine, currentSourceBlockPrologue);

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
		} else if (!isSemanticInstructionLine(parsedLine)) {
			onlySemanticLinesBeforeSourceBlock = false;
		}

		if (isBlockStartInstruction(parsedLine.instruction)) {
			switch (parsedLine.instruction) {
				case 'if':
					blockStack.push({
						instruction: 'if',
						astIndex,
						line: parsedLine,
						hasElse: false,
					});
					break;
				case 'block':
					blockStack.push({
						instruction: 'block',
						astIndex,
						line: parsedLine,
					});
					break;
				default:
					blockStack.push({
						instruction: parsedLine.instruction,
						astIndex,
					});
			}

			if (sourceBlockStartInstructionSet.has(parsedLine.instruction)) {
				sourceBlockPrologueStack.push({
					instruction: parsedLine.instruction as SourceBlockPrologue['instruction'],
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
						lineNumber,
						instruction: parsedLine.instruction,
					}
				);
			}

			if (openBlock.hasElse) {
				throw new SyntaxRulesError(
					SyntaxErrorCode.INVALID_BLOCK_STRUCTURE,
					'Unexpected else: if blocks may only contain one else branch.',
					{
						lineNumber,
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
					lineNumber,
					instruction: parsedLine.instruction,
				}
			);
		}

		if (openBlock.instruction !== expectedStartInstruction) {
			throw new SyntaxRulesError(
				SyntaxErrorCode.INVALID_BLOCK_STRUCTURE,
				`Unexpected ${endInstruction}: expected ${openBlock.instruction} to be closed before ending ${expectedStartInstruction}.`,
				{
					lineNumber,
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

		if (parsedLine.instruction === 'ifEnd' && openBlock.instruction === 'if') {
			const resultTypes = getResultTypesFromArguments(parsedLine);
			openBlock.line.ifBlock = {
				matchingIfEndIndex: astIndex,
				resultTypes,
				hasElse: Boolean(openBlock.hasElse),
			};
			parsedLine.ifEndBlock = {
				matchingIfIndex: openBlock.astIndex,
				resultTypes,
			};
		} else if (parsedLine.instruction === 'blockEnd' && openBlock.instruction === 'block') {
			const resultTypes = getResultTypesFromArguments(parsedLine);
			openBlock.line.blockBlock = {
				matchingBlockEndIndex: astIndex,
				resultTypes,
			};
			parsedLine.blockEndBlock = {
				matchingBlockIndex: openBlock.astIndex,
				resultTypes,
			};
		}
	}

	if (blockStack.length > 0) {
		const openBlock = blockStack[blockStack.length - 1];
		const openLine = ast[openBlock.astIndex];

		throw new SyntaxRulesError(SyntaxErrorCode.INVALID_BLOCK_STRUCTURE, `Unclosed ${openBlock.instruction} block.`, {
			lineNumber: openLine.lineNumber,
			instruction: openBlock.instruction,
		});
	}

	return { lines: ast, astBuilder };
}

export function compileToASTLines(
	code: string[],
	cache?: ASTCache<CompilerASTLines>,
	cacheKey?: string
): CompilerASTLines {
	const cached = cacheKey !== undefined ? cache?.entries.get(cacheKey) : undefined;
	const cachedLookup = getASTCacheLookupResult(cached, code);
	if (cachedLookup.ast) {
		cache!.stats.hits++;
		return cachedLookup.ast;
	}
	if (cache && cacheKey !== undefined) {
		cache.stats.misses++;
	}

	const ast = parseCompilerSource(code).lines;

	if (cache && cacheKey !== undefined) {
		const entry: ASTCacheEntry<CompilerASTLines> = {
			ast,
			hashInput: {
				code,
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

export function compileToAST(code: string[], cache?: ASTCache<AST>, cacheKey?: string): AST {
	const cached = cacheKey !== undefined ? cache?.entries.get(cacheKey) : undefined;
	const cachedLookup = getASTCacheLookupResult(cached, code);
	if (cachedLookup.ast) {
		cache!.stats.hits++;
		return cachedLookup.ast;
	}
	if (cache && cacheKey !== undefined) {
		cache.stats.misses++;
	}

	const parsedSource = parseCompilerSource(code);
	const group = toAST(parsedSource);

	if (cache && cacheKey !== undefined) {
		const entry: ASTCacheEntry<AST> = {
			ast: group,
			hashInput: {
				code,
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
