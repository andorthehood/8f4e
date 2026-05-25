import { ArgumentType } from './arguments';
import {
	arrayMemoryDeclarationInstructions,
	memoryDeclarationInstructions,
	scalarMemoryDeclarationInstructions,
	type ArrayDeclarationInstruction,
	type ScalarMemoryDeclarationInstruction,
} from './memory';

import type {
	Argument,
	ArgumentCompileTimeExpression,
	ArgumentIdentifier,
	ArgumentLiteral,
	ArgumentStringLiteral,
} from './arguments';

type MacroInstructionName = 'defineMacro' | 'defineMacroEnd' | 'macro';
type DocumentOnlyInstructionName = 'note' | 'noteEnd';

export const noArgumentCodegenInstructionNames = [
	'abs',
	'add',
	'and',
	'castToFloat',
	'castToFloat64',
	'castToInt',
	'clearStack',
	'div',
	'drop',
	'ensureNonZero',
	'equal',
	'equalToZero',
	'fallingEdge',
	'greaterOrEqual',
	'greaterOrEqualUnsigned',
	'greaterThan',
	'hasChanged',
	'lessOrEqual',
	'lessThan',
	'load',
	'load8u',
	'load16u',
	'load8s',
	'load16s',
	'loadFloat',
	'min',
	'max',
	'mul',
	'notEqual',
	'notZero',
	'or',
	'remainder',
	'risingEdge',
	'round',
	'shiftLeft',
	'shiftRight',
	'shiftRightUnsigned',
	'sqrt',
	'store',
	'sub',
	'xor',
] as const;

type NoArgumentCodegenInstructionName = (typeof noArgumentCodegenInstructionNames)[number];
type ClampAddressInstructionName = 'clampAddress' | 'clampModuleAddress' | 'clampGlobalAddress';

export type ASTLineBase<Instruction extends string, Arguments extends Array<Argument>> = {
	lineNumberBeforeMacroExpansion: number;
	lineNumberAfterMacroExpansion: number;
	instruction: Instruction;
	arguments: Arguments;
	isSemanticOnly?: boolean;
	isMemoryDeclaration?: boolean;
	isBlockPrologue?: boolean;
	hasExplicitMemoryDefault?: boolean;
	ifBlock?: IfBlockMetadata;
	ifEndBlock?: IfEndBlockMetadata;
	blockBlock?: BlockBlockMetadata;
	blockEndBlock?: BlockEndBlockMetadata;
};

export type ParsedLineMetadata = Array<{ callSiteLineNumber: number; macroId?: string }>;

export type CompileTimeValueArgument = ArgumentLiteral | ArgumentIdentifier | ArgumentCompileTimeExpression;
export type PushArgument = ArgumentLiteral | ArgumentIdentifier | ArgumentCompileTimeExpression | ArgumentStringLiteral;
export type PushLine = ASTLineBase<'push', [PushArgument]>;

export type IfBlockResultType = 'int' | 'float' | null;

export interface IfBlockMetadata {
	matchingIfEndIndex: number;
	resultType: IfBlockResultType;
	hasElse: boolean;
}

export interface IfEndBlockMetadata {
	matchingIfIndex: number;
	resultType: IfBlockResultType;
}

export type IfLine = ASTLineBase<'if', []>;
export type IfEndLine = ASTLineBase<'ifEnd', [] | [ArgumentIdentifier]>;

export type BlockBlockResultType = 'int' | 'float' | null;

export interface BlockBlockMetadata {
	matchingBlockEndIndex: number;
	resultType: BlockBlockResultType;
}

export interface BlockEndBlockMetadata {
	matchingBlockIndex: number;
	resultType: BlockBlockResultType;
}

export type BlockLine = ASTLineBase<'block', []>;
export type BlockEndLine = ASTLineBase<'blockEnd', [] | [ArgumentIdentifier]>;
export type LocalSetLine = ASTLineBase<'localSet', [ArgumentIdentifier]>;
export type LocalVariableAccessLine = LocalSetLine;
export type TokenizedLocalVariableAccessLine = LocalVariableAccessLine;

export type FunctionLine = ASTLineBase<'function', [ArgumentIdentifier]>;
export type FunctionEndLine = ASTLineBase<'functionEnd', ArgumentIdentifier[]>;
export type CallLine = ASTLineBase<'call', [ArgumentIdentifier]>;
export type ModuleLine = ASTLineBase<'module', [ArgumentIdentifier]>;
export type ModuleEndLine = ASTLineBase<'moduleEnd', []>;
export type ConstantsLine = ASTLineBase<'constants', [ArgumentIdentifier]>;
export type ConstantsEndLine = ASTLineBase<'constantsEnd', []>;
export type UseLine = ASTLineBase<'use', [ArgumentIdentifier]>;
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
export type ConstLine = ASTLineBase<'const', [ArgumentIdentifier, CompileTimeValueArgument]>;

export type MapValueArgument =
	| ArgumentLiteral
	| ArgumentIdentifier
	| ArgumentCompileTimeExpression
	| ArgumentStringLiteral;
export type MapLine = ASTLineBase<'map', [MapValueArgument, MapValueArgument]>;

export type DefaultLine = ASTLineBase<'default', [CompileTimeValueArgument]>;

export type LoopLine = ASTLineBase<'loop', [] | [ArgumentLiteral]>;
export type LoopEndLine = ASTLineBase<'loopEnd', []>;
export type LoopIndexLine = ASTLineBase<'loopIndex', []>;
export type ElseLine = ASTLineBase<'else', []>;
export type ReturnLine = ASTLineBase<'return', []>;
export type LoopCapLine = ASTLineBase<'#loopCap', [ArgumentLiteral]>;
export type ImpureLine = ASTLineBase<'#impure', []>;
export type ExportLine = ASTLineBase<'#export', [] | [ArgumentIdentifier]>;
export type RegionLine = ASTLineBase<'#region', [ArgumentIdentifier | ArgumentLiteral]>;
export type SkipExecutionLine = ASTLineBase<'#skipExecution', []>;
export type InitOnlyLine = ASTLineBase<'#initOnly', []>;
export type ClampAddressLine = ASTLineBase<ClampAddressInstructionName, [] | [CompileTimeValueArgument]>;
export type NoArgumentCodegenLine = ASTLineBase<NoArgumentCodegenInstructionName, []>;

export type MemoryDeclarationArgument =
	| ArgumentLiteral
	| ArgumentIdentifier
	| ArgumentCompileTimeExpression
	| ArgumentStringLiteral;
export type ScalarMemoryDeclarationLine = ASTLineBase<
	ScalarMemoryDeclarationInstruction,
	[MemoryDeclarationArgument, ...MemoryDeclarationArgument[]]
>;
export type NamedScalarMemoryDeclarationLine = Omit<ScalarMemoryDeclarationLine, 'arguments'> & {
	arguments: [ArgumentIdentifier, ...MemoryDeclarationArgument[]];
};
export type ArrayMemoryDeclarationLine = ASTLineBase<
	ArrayDeclarationInstruction,
	[ArgumentIdentifier, CompileTimeValueArgument, ...MemoryDeclarationArgument[]]
>;
export type MemoryDeclarationLine = ScalarMemoryDeclarationLine | ArrayMemoryDeclarationLine;

type ExplicitCompilerASTLine =
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
	| InitOnlyLine
	| ClampAddressLine
	| NoArgumentCodegenLine
	| MemoryDeclarationLine;

export type CompilerASTLine =
	| ExplicitCompilerASTLine
	| ASTLineBase<MacroInstructionName | DocumentOnlyInstructionName, Array<Argument>>;

export type ASTLine = CompilerASTLine;

export type AST = CompilerASTLine[];

export type ModuleAst = [ModuleLine, ...CompilerASTLine[], ModuleEndLine];
export type FunctionAst = [FunctionLine, ...CompilerASTLine[], FunctionEndLine];
export type ConstantsAst = [ConstantsLine, ...CompilerASTLine[], ConstantsEndLine];
export type CompilerSourceAst = ModuleAst | FunctionAst | ConstantsAst;

const scalarMemoryDeclarationInstructionSet = new Set<string>(scalarMemoryDeclarationInstructions);
const arrayMemoryDeclarationInstructionSet = new Set<string>(arrayMemoryDeclarationInstructions);
const memoryDeclarationInstructionSet = new Set<string>(memoryDeclarationInstructions);

export function isFunctionLine(line: CompilerASTLine | undefined): line is FunctionLine {
	return line?.instruction === 'function';
}

export function isFunctionEndLine(line: CompilerASTLine | undefined): line is FunctionEndLine {
	return line?.instruction === 'functionEnd';
}

export function isParamLine(line: CompilerASTLine | undefined): line is ParamLine {
	return line?.instruction === 'param';
}

export function isModuleLine(line: CompilerASTLine | undefined): line is ModuleLine {
	return line?.instruction === 'module';
}

export function isConstantsLine(line: CompilerASTLine | undefined): line is ConstantsLine {
	return line?.instruction === 'constants';
}

export function isUseLine(line: CompilerASTLine | undefined): line is UseLine {
	return line?.instruction === 'use';
}

export function isIfEndLine(line: CompilerASTLine | undefined): line is IfEndLine {
	return line?.instruction === 'ifEnd';
}

export function isBlockEndLine(line: CompilerASTLine | undefined): line is BlockEndLine {
	return line?.instruction === 'blockEnd';
}

export function isMemoryDeclarationLine(line: CompilerASTLine | undefined): line is MemoryDeclarationLine {
	return line !== undefined && memoryDeclarationInstructionSet.has(line.instruction);
}

export function isScalarMemoryDeclarationLine(line: CompilerASTLine | undefined): line is ScalarMemoryDeclarationLine {
	return line !== undefined && scalarMemoryDeclarationInstructionSet.has(line.instruction);
}

export function isArrayMemoryDeclarationLine(line: CompilerASTLine | undefined): line is ArrayMemoryDeclarationLine {
	return line !== undefined && arrayMemoryDeclarationInstructionSet.has(line.instruction);
}

export function isNamedScalarMemoryDeclarationLine(
	line: CompilerASTLine | undefined
): line is NamedScalarMemoryDeclarationLine {
	return isScalarMemoryDeclarationLine(line) && line.arguments[0]?.type === ArgumentType.IDENTIFIER;
}
