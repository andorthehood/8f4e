import { ArgumentType } from './arguments';
import {
	arrayMemoryDeclarationInstructions,
	memoryDeclarationInstructions,
	scalarMemoryDeclarationInstructions,
	type ArrayDeclarationInstruction,
	type ScalarMemoryDeclarationInstruction,
} from './memory';
import { semanticInstructionNames } from './instructions';

import type {
	Argument,
	ArgumentCompileTimeExpression,
	ArgumentIdentifier,
	ArgumentLiteral,
	ArgumentStringLiteral,
} from './arguments';
import type { FunctionSignature } from './functionTypes';
import type { NoSourceArgumentInstructionName } from './instructionSpecs';
import type { DocumentOnlyInstructionName, MacroInstructionName, SemanticInstructionName } from './instructions';

type ClampAddressInstructionName = 'clampAddress' | 'clampModuleAddress' | 'clampGlobalAddress';

export type ASTLineBase<Instruction extends string, Arguments extends Array<Argument>> = {
	lineNumberBeforeMacroExpansion: number;
	lineNumberAfterMacroExpansion: number;
	instruction: Instruction;
	arguments: Arguments;
};

export type ParsedLineMetadata = Array<{ callSiteLineNumber: number; macroId?: string }>;

export type CompileTimeValueArgument = ArgumentLiteral | ArgumentIdentifier | ArgumentCompileTimeExpression;
export type PushArgument = ArgumentLiteral | ArgumentIdentifier | ArgumentCompileTimeExpression | ArgumentStringLiteral;
export type PushLine = ASTLineBase<'push', [PushArgument]>;

export type IfBlockResultType = 'int' | 'float' | null;

/** Parser metadata linking an `if` line to its closing line and result shape. */
export interface IfBlockMetadata {
	matchingIfEndIndex: number;
	resultType: IfBlockResultType;
	hasElse: boolean;
}

/** Parser metadata linking an `ifEnd` line back to its opening `if`. */
export interface IfEndBlockMetadata {
	matchingIfIndex: number;
	resultType: IfBlockResultType;
}

export type IfLine = ASTLineBase<'if', []> & {
	ifBlock?: IfBlockMetadata;
};
export type IfEndLine = ASTLineBase<'ifEnd', [] | [ArgumentIdentifier]> & {
	ifEndBlock?: IfEndBlockMetadata;
};

export type BlockBlockResultType = 'int' | 'float' | null;

/** Parser metadata linking a generic `block` line to its closing line. */
export interface BlockBlockMetadata {
	matchingBlockEndIndex: number;
	resultType: BlockBlockResultType;
}

/** Parser metadata linking a `blockEnd` line back to its opening `block`. */
export interface BlockEndBlockMetadata {
	matchingBlockIndex: number;
	resultType: BlockBlockResultType;
}

export type BlockLine = ASTLineBase<'block', []> & {
	blockBlock?: BlockBlockMetadata;
};
export type BlockEndLine = ASTLineBase<'blockEnd', [] | [ArgumentIdentifier]> & {
	blockEndBlock?: BlockEndBlockMetadata;
};
export type LocalSetLine = ASTLineBase<'localSet', [ArgumentIdentifier]>;

export type FunctionLine = ASTLineBase<'function', [ArgumentIdentifier]>;
export type FunctionEndLine = ASTLineBase<'functionEnd', ArgumentIdentifier[]>;
export type CallLine = ASTLineBase<'call', [ArgumentIdentifier]>;
export type ModuleLine = ASTLineBase<'module', [ArgumentIdentifier]>;
export type ModuleEndLine = ASTLineBase<'moduleEnd', []>;
export type ConstantsLine = ASTLineBase<'constants', [ArgumentIdentifier]>;
export type ConstantsEndLine = ASTLineBase<'constantsEnd', []>;
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
export type BranchIfUnchangedLine = ASTLineBase<'branchIfUnchanged', [ArgumentLiteral]>;
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
export type MapLine = ASTLineBase<'map', [MapValueArgument, MapValueArgument]>;

export type DefaultLine = ASTLineBase<'default', [CompileTimeValueArgument]>;

type CompilerDirectivePrologueMetadata = {
	isBlockPrologue?: true;
};

export type LoopLine = ASTLineBase<'loop', [] | [ArgumentLiteral]>;
export type LoopEndLine = ASTLineBase<'loopEnd', []>;
export type LoopIndexLine = ASTLineBase<'loopIndex', []>;
export type ElseLine = ASTLineBase<'else', []>;
export type ReturnLine = ASTLineBase<'return', []>;
export type LoopCapLine = ASTLineBase<'#loopCap', [ArgumentLiteral]> & CompilerDirectivePrologueMetadata;
export type ImpureLine = ASTLineBase<'#impure', []> & CompilerDirectivePrologueMetadata;
export type ExportLine = ASTLineBase<'#export', [] | [ArgumentIdentifier]> & CompilerDirectivePrologueMetadata;
export type RegionLine = ASTLineBase<'#region', [ArgumentIdentifier | ArgumentLiteral]> &
	CompilerDirectivePrologueMetadata;
export type SkipExecutionLine = ASTLineBase<'#skipExecution', []> & CompilerDirectivePrologueMetadata;
export type AssertLine = ASTLineBase<'assert', [CompileTimeValueArgument]>;
export type ClampAddressLine = ASTLineBase<ClampAddressInstructionName, [] | [CompileTimeValueArgument]>;
export type CompilerDirectiveLine = LoopCapLine | ImpureLine | ExportLine | RegionLine | SkipExecutionLine;

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
	| ConstantsEndLine;

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
	| UseLine
	| LocalDeclarationLine
	| ParamLine
	| MapBeginLine
	| MapEndLine
	| BranchLine
	| BranchIfTrueLine
	| BranchIfUnchangedLine
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
	| RegionLine
	| SkipExecutionLine
	| AssertLine
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

/** Parsed AST for a module block and its memory declarations. */
export interface ModuleAST {
	type: 'module';
	id: string;
	lines: CompilerASTLines;
	moduleLine: ModuleLine;
	regionLine?: RegionLine;
	memoryDeclarationLines: readonly MemoryDeclarationLine[];
}

/** Parsed AST for a function block and its resolved signature. */
export interface FunctionAST {
	type: 'function';
	id: string;
	lines: CompilerASTLines;
	functionLine: FunctionLine;
	functionEndLine: FunctionEndLine;
	signature: FunctionSignature;
	exportLine?: ExportLine;
	exportName?: string;
}

/** Parsed AST for a constants block. */
export interface ConstantsAST {
	type: 'constants';
	id: string;
	lines: CompilerASTLines;
	constantsLine: ConstantsLine;
}

export type AST = ModuleAST | FunctionAST | ConstantsAST;

const scalarMemoryDeclarationInstructionSet = new Set<string>(scalarMemoryDeclarationInstructions);
const arrayMemoryDeclarationInstructionSet = new Set<string>(arrayMemoryDeclarationInstructions);
const memoryDeclarationInstructionSet = new Set<string>(memoryDeclarationInstructions);
const semanticInstructionSet = new Set<string>(semanticInstructionNames);

/**
 * Checks whether a parsed line is a semantic instruction handled before code generation.
 * These lines affect compiler state, namespaces, or constants rather than directly
 * producing WebAssembly instructions.
 */
export function isSemanticInstructionLine(line: CompilerASTLine | undefined): line is SemanticInstructionLine {
	return line !== undefined && semanticInstructionSet.has(line.instruction as SemanticInstructionName);
}

/** Checks whether a parsed line is a compiler directive instruction. */
export function isCompilerDirectiveLine(line: CompilerASTLine | undefined): line is CompilerDirectiveLine {
	return line !== undefined && line.instruction.startsWith('#');
}

/**
 * Checks whether a parsed line declares scalar or array memory.
 * The parser keeps declarations in the same AST union as executable lines; this
 * guard narrows them before layout and namespace collection.
 */
export function isMemoryDeclarationLine(line: CompilerASTLine | undefined): line is MemoryDeclarationLine {
	return line !== undefined && memoryDeclarationInstructionSet.has(line.instruction);
}

/** Checks whether a parsed line declares scalar memory. */
export function isScalarMemoryDeclarationLine(line: CompilerASTLine | undefined): line is ScalarMemoryDeclarationLine {
	return line !== undefined && scalarMemoryDeclarationInstructionSet.has(line.instruction);
}

/** Checks whether a parsed line declares array memory. */
export function isArrayMemoryDeclarationLine(line: CompilerASTLine | undefined): line is ArrayMemoryDeclarationLine {
	return line !== undefined && arrayMemoryDeclarationInstructionSet.has(line.instruction);
}

/**
 * Checks whether a scalar memory declaration starts with an identifier name.
 * Scalar declarations may also be anonymous literal data, so code that needs a
 * named memory binding must use this narrower guard.
 */
export function isNamedScalarMemoryDeclarationLine(
	line: CompilerASTLine | undefined
): line is NamedScalarMemoryDeclarationLine {
	return isScalarMemoryDeclarationLine(line) && line.arguments[0]?.type === ArgumentType.IDENTIFIER;
}
