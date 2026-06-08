import type {
	Argument,
	ArgumentCompileTimeExpression,
	ArgumentIdentifier,
	ArgumentLiteral,
	ArgumentStringLiteral,
} from './arguments';
import { ArgumentType } from './arguments';
import type { FunctionImportMetadata } from './functionTypes';
import type { NoSourceArgumentInstructionName } from './instructionSpecTypes';
import type { DocumentOnlyInstructionName, MacroInstructionName, SemanticInstructionName } from './instructions';
import { semanticInstructionNames } from './instructions';
import {
	type ArrayDeclarationInstruction,
	arrayMemoryDeclarationInstructions,
	memoryDeclarationInstructions,
	type ScalarMemoryDeclarationInstruction,
	scalarMemoryDeclarationInstructions,
} from './memory';

type ClampAddressInstructionName = 'clampAddress' | 'clampModuleAddress' | 'clampGlobalAddress';

export type ASTLineBase<Instruction extends string, Arguments extends Array<Argument>> = {
	lineNumber: number;
	instruction: Instruction;
	arguments: Arguments;
};

export type CompileTimeValueArgument = ArgumentLiteral | ArgumentIdentifier | ArgumentCompileTimeExpression;
export type PushArgument = ArgumentLiteral | ArgumentIdentifier | ArgumentCompileTimeExpression | ArgumentStringLiteral;
export type PushLine = ASTLineBase<'push', [PushArgument]>;

export type BlockResultType = 'int' | 'float';
export type BlockResultTypes = BlockResultType[];

/** Parser metadata linking an `if` line to its closing line and result shape. */
export interface IfBlockMetadata {
	matchingIfEndIndex: number;
	resultTypes: BlockResultTypes;
	hasElse: boolean;
}

/** Parser metadata linking an `ifEnd` line back to its opening `if`. */
export interface IfEndBlockMetadata {
	matchingIfIndex: number;
	resultTypes: BlockResultTypes;
}

export type IfLine = ASTLineBase<'if', []> & {
	ifBlock?: IfBlockMetadata;
};
export type PairedIfLine = IfLine & {
	ifBlock: IfBlockMetadata;
};
export type IfEndLine = ASTLineBase<'ifEnd', ArgumentIdentifier[]> & {
	ifEndBlock?: IfEndBlockMetadata;
};

/** Parser metadata linking a generic `block` line to its closing line. */
export interface BlockBlockMetadata {
	matchingBlockEndIndex: number;
	resultTypes: BlockResultTypes;
}

/** Parser metadata linking a `blockEnd` line back to its opening `block`. */
export interface BlockEndBlockMetadata {
	matchingBlockIndex: number;
	resultTypes: BlockResultTypes;
}

export type BlockLine = ASTLineBase<'block', []> & {
	blockBlock?: BlockBlockMetadata;
};
export type PairedBlockLine = BlockLine & {
	blockBlock: BlockBlockMetadata;
};
export type BlockEndLine = ASTLineBase<'blockEnd', [] | [ArgumentIdentifier]> & {
	blockEndBlock?: BlockEndBlockMetadata;
};
export type LocalSetLine = ASTLineBase<'localSet', [ArgumentIdentifier]>;

export type FunctionLine = ASTLineBase<'function', [ArgumentIdentifier]>;
export type FunctionEndLine = ASTLineBase<'functionEnd', ArgumentIdentifier[]>;
export type CallLine = ASTLineBase<'call', [ArgumentIdentifier, ...PushArgument[]]>;
export type ModuleLine = ASTLineBase<'module', [ArgumentIdentifier]>;
export type ModuleEndLine = ASTLineBase<'moduleEnd', []>;
export type ConstantsLine = ASTLineBase<'constants', [ArgumentIdentifier]>;
export type ConstantsEndLine = ASTLineBase<'constantsEnd', []>;
export type PrototypeLine = ASTLineBase<'prototype', [ArgumentIdentifier]>;
export type PrototypeEndLine = ASTLineBase<'prototypeEnd', []>;
export type ShapeLine = ASTLineBase<'shape', [ArgumentIdentifier]>;
export type ParamShapeLine = ASTLineBase<'paramShape', [ArgumentIdentifier]>;
export type PushShapeLine = ASTLineBase<'pushShape', [ArgumentIdentifier]>;
export type ReferencedNamespaceIdsMetadata = {
	referencedNamespaceIds?: readonly string[];
};
export type UseLine = ASTLineBase<'use', [ArgumentIdentifier]> & ReferencedNamespaceIdsMetadata;
export type LocalDeclarationLine = ASTLineBase<'local', [ArgumentIdentifier, ArgumentIdentifier]>;
export type ParamLine = ASTLineBase<'param', [ArgumentIdentifier, ArgumentIdentifier]>;
export type MapBeginLine = ASTLineBase<'mapBegin', [ArgumentIdentifier]>;
export type MapEndLine = ASTLineBase<'mapEnd', [ArgumentIdentifier]>;
export type BranchLine = ASTLineBase<'branch', [ArgumentLiteral]>;
export type BranchIfTrueLine = ASTLineBase<'branchIfTrue', [ArgumentLiteral]>;
export type ExitIfTrueLine = ASTLineBase<'exitIfTrue', []>;
export type StoreBytesLine = ASTLineBase<'storeBytes', [ArgumentLiteral]>;
export type MemoryCopyLine = ASTLineBase<'memoryCopy', [CompileTimeValueArgument]>;
export type ConstLine = ASTLineBase<'const', [ArgumentIdentifier, CompileTimeValueArgument]> &
	ReferencedNamespaceIdsMetadata;
export type EnsureNonZeroLine = ASTLineBase<'ensureNonZero', [] | [ArgumentLiteral]>;

export type MapValueArgument =
	| ArgumentLiteral
	| ArgumentIdentifier
	| ArgumentCompileTimeExpression
	| ArgumentStringLiteral;
export type MapLine = ASTLineBase<'map', [MapValueArgument] | [MapValueArgument, MapValueArgument]>;

export type DefaultLine = ASTLineBase<'default', [CompileTimeValueArgument]>;

type CompilerDirectivePrologueMetadata = {
	isBlockPrologue?: true;
};

export type LoopLine = ASTLineBase<'loop', [] | [CompileTimeValueArgument]>;
export type LoopEndLine = ASTLineBase<'loopEnd', []>;
export type LoopIndexLine = ASTLineBase<'loopIndex', []>;
export type ElseLine = ASTLineBase<'else', []>;
export type ReturnLine = ASTLineBase<'return', []>;
export type LoopCapLine = ASTLineBase<'#loopCap', [ArgumentLiteral]> & CompilerDirectivePrologueMetadata;
export type ImpureLine = ASTLineBase<'#impure', []> & CompilerDirectivePrologueMetadata;
export type ExportLine = ASTLineBase<'#export', [] | [ArgumentIdentifier]> & CompilerDirectivePrologueMetadata;
export type ImportLine = ASTLineBase<'#import', [ArgumentIdentifier | ArgumentStringLiteral]> &
	CompilerDirectivePrologueMetadata;
export type RegionLine = ASTLineBase<'#region', [ArgumentIdentifier | ArgumentLiteral]> &
	CompilerDirectivePrologueMetadata;
export type SkipExecutionLine = ASTLineBase<'#skipExecution', []> & CompilerDirectivePrologueMetadata;
export type ClampAddressLine = ASTLineBase<ClampAddressInstructionName, [] | [CompileTimeValueArgument]>;
export type CompilerDirectiveLine = LoopCapLine | ImpureLine | ExportLine | ImportLine | RegionLine | SkipExecutionLine;

export type MemoryDeclarationArgument =
	| ArgumentLiteral
	| ArgumentIdentifier
	| ArgumentCompileTimeExpression
	| ArgumentStringLiteral;

type ExplicitMemoryDefaultMetadata = {
	hasExplicitMemoryDefault: boolean;
};

export type ScalarMemoryDeclarationLine = ASTLineBase<
	ScalarMemoryDeclarationInstruction,
	[MemoryDeclarationArgument, ...MemoryDeclarationArgument[]]
> &
	ExplicitMemoryDefaultMetadata &
	ReferencedNamespaceIdsMetadata;
export type NamedScalarMemoryDeclarationLine = Omit<ScalarMemoryDeclarationLine, 'arguments'> & {
	arguments: [ArgumentIdentifier, ...MemoryDeclarationArgument[]];
};
export type ArrayMemoryDeclarationLine = ASTLineBase<
	ArrayDeclarationInstruction,
	[ArgumentIdentifier, CompileTimeValueArgument, ...MemoryDeclarationArgument[]]
> &
	ExplicitMemoryDefaultMetadata &
	ReferencedNamespaceIdsMetadata;
export type MemoryDeclarationLine = ScalarMemoryDeclarationLine | ArrayMemoryDeclarationLine;

export type SemanticInstructionLine =
	| ConstLine
	| UseLine
	| ModuleLine
	| RegionLine
	| ModuleEndLine
	| ConstantsLine
	| ConstantsEndLine
	| PrototypeLine
	| PrototypeEndLine
	| ShapeLine;

type ExplicitCompilerASTLineWithoutGenericNoSource =
	| PushLine
	| IfLine
	| IfEndLine
	| BlockLine
	| BlockEndLine
	| LocalSetLine
	| FunctionLine
	| FunctionEndLine
	| CallLine
	| ModuleLine
	| ModuleEndLine
	| ConstantsLine
	| ConstantsEndLine
	| PrototypeLine
	| PrototypeEndLine
	| ShapeLine
	| ParamShapeLine
	| PushShapeLine
	| UseLine
	| LocalDeclarationLine
	| ParamLine
	| MapBeginLine
	| MapEndLine
	| BranchLine
	| BranchIfTrueLine
	| ExitIfTrueLine
	| StoreBytesLine
	| MemoryCopyLine
	| ConstLine
	| EnsureNonZeroLine
	| MapLine
	| DefaultLine
	| LoopLine
	| LoopEndLine
	| LoopIndexLine
	| ElseLine
	| ReturnLine
	| LoopCapLine
	| ImpureLine
	| ExportLine
	| ImportLine
	| RegionLine
	| SkipExecutionLine
	| ClampAddressLine
	| MemoryDeclarationLine;

type GenericNoSourceArgumentInstructionName = Exclude<
	NoSourceArgumentInstructionName,
	ExplicitCompilerASTLineWithoutGenericNoSource['instruction']
>;

export type NoSourceArgumentLine = ASTLineBase<GenericNoSourceArgumentInstructionName, []>;

type ExplicitCompilerASTLine = ExplicitCompilerASTLineWithoutGenericNoSource | NoSourceArgumentLine;

export type CompilerASTLine =
	| ExplicitCompilerASTLine
	| ASTLineBase<MacroInstructionName | DocumentOnlyInstructionName, Array<Argument>>;

export type CompilerASTLines = CompilerASTLine[];

/**
 * Checks whether a parsed line carries resolved namespace reference metadata.
 * Namespace references are added by semantic normalization for instructions that
 * may depend on other modules or constants blocks, so callers can avoid probing
 * optional metadata by hand.
 *
 * @param line - Parsed compiler AST line to inspect.
 * @returns True when the line carries resolved namespace reference ids.
 */
export function hasReferencedNamespaceIds(
	line: CompilerASTLine | undefined
): line is CompilerASTLine & { referencedNamespaceIds: readonly string[] } {
	return (
		line !== undefined &&
		'referencedNamespaceIds' in line &&
		(line as ReferencedNamespaceIdsMetadata).referencedNamespaceIds !== undefined
	);
}

/** Compiler project/source metadata carried with a parsed source block. */
export interface SourceBlockMetadata {
	projectBlockId?: number;
}

/** Parsed AST for a module block and its memory declarations. */
export interface ModuleAST extends SourceBlockMetadata {
	type: 'module';
	id: string;
	lines: CompilerASTLines;
	moduleLine: ModuleLine;
	regionLine?: RegionLine;
	memoryDeclarationLines: readonly MemoryDeclarationLine[];
}

/** Parsed AST for a function block. */
export interface FunctionAST extends SourceBlockMetadata {
	type: 'function';
	id: string;
	lines: CompilerASTLines;
	functionLine: FunctionLine;
	functionEndLine: FunctionEndLine;
	exportLine?: ExportLine;
	exportName?: string;
	importLine?: ImportLine;
	import?: FunctionImportMetadata;
}

/** Parsed AST for a constants block. */
export interface ConstantsAST extends SourceBlockMetadata {
	type: 'constants';
	id: string;
	lines: CompilerASTLines;
	constantsLine: ConstantsLine;
}

/** Parsed AST for a reusable memory-shape prototype block. */
export interface PrototypeAST extends SourceBlockMetadata {
	type: 'prototype';
	id: string;
	lines: CompilerASTLines;
	prototypeLine: PrototypeLine;
	memoryDeclarationLines: readonly MemoryDeclarationLine[];
}

export type AST = ModuleAST | FunctionAST | ConstantsAST | PrototypeAST;

declare const validatedASTBrand: unique symbol;

/** AST produced by the tokenizer after source-level syntax and block validation. */
export type ValidatedAST<TAST extends AST = AST> = TAST & {
	readonly [validatedASTBrand]: true;
};
export type ValidatedModuleAST = ValidatedAST<ModuleAST>;
export type ValidatedFunctionAST = ValidatedAST<FunctionAST>;
export type ValidatedConstantsAST = ValidatedAST<ConstantsAST>;
export type ValidatedPrototypeAST = ValidatedAST<PrototypeAST>;

const scalarMemoryDeclarationInstructionSet = new Set<string>(scalarMemoryDeclarationInstructions);
const arrayMemoryDeclarationInstructionSet = new Set<string>(arrayMemoryDeclarationInstructions);
const memoryDeclarationInstructionSet = new Set<string>(memoryDeclarationInstructions);
const semanticInstructionSet = new Set<string>(semanticInstructionNames);

/**
 * Checks whether a parsed line is a semantic instruction handled before code generation.
 * These lines affect compiler state, namespaces, or constants rather than directly
 * producing WebAssembly instructions.
 *
 * @param line - Parsed compiler AST line to inspect.
 * @returns True when the line is a semantic instruction.
 */
export function isSemanticInstructionLine(line: CompilerASTLine | undefined): line is SemanticInstructionLine {
	return line !== undefined && semanticInstructionSet.has(line.instruction as SemanticInstructionName);
}

/**
 * Checks whether a parsed line is a compiler directive instruction.
 *
 * @param line - Parsed compiler AST line to inspect.
 * @returns True when the instruction is a compiler directive.
 */
export function isCompilerDirectiveLine(line: CompilerASTLine | undefined): line is CompilerDirectiveLine {
	return line !== undefined && line.instruction.startsWith('#');
}

/**
 * Checks whether a parsed line declares scalar or array memory.
 * The parser keeps declarations in the same AST union as executable lines; this
 * guard narrows them before layout and namespace collection.
 *
 * @param line - Parsed compiler AST line to inspect.
 * @returns True when the line declares memory.
 */
export function isMemoryDeclarationLine(line: CompilerASTLine | undefined): line is MemoryDeclarationLine {
	return line !== undefined && memoryDeclarationInstructionSet.has(line.instruction);
}

/**
 * Checks whether a parsed line declares scalar memory.
 *
 * @param line - Parsed compiler AST line to inspect.
 * @returns True when the line declares scalar memory.
 */
export function isScalarMemoryDeclarationLine(line: CompilerASTLine | undefined): line is ScalarMemoryDeclarationLine {
	return line !== undefined && scalarMemoryDeclarationInstructionSet.has(line.instruction);
}

/**
 * Checks whether a parsed line declares array memory.
 *
 * @param line - Parsed compiler AST line to inspect.
 * @returns True when the line declares array memory.
 */
export function isArrayMemoryDeclarationLine(line: CompilerASTLine | undefined): line is ArrayMemoryDeclarationLine {
	return line !== undefined && arrayMemoryDeclarationInstructionSet.has(line.instruction);
}

/**
 * Checks whether a scalar memory declaration starts with an identifier name.
 * Scalar declarations may also be anonymous literal data, so code that needs a
 * named memory binding must use this narrower guard.
 *
 * @param line - Parsed compiler AST line to inspect.
 * @returns True when the line declares named scalar memory.
 */
export function isNamedScalarMemoryDeclarationLine(
	line: CompilerASTLine | undefined
): line is NamedScalarMemoryDeclarationLine {
	return isScalarMemoryDeclarationLine(line) && line.arguments[0]?.type === ArgumentType.IDENTIFIER;
}
