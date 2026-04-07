import {
	ArgumentType,
	type Argument,
	type ArgumentCompileTimeExpression,
	type ArgumentIdentifier,
	type ArgumentLiteral,
	type ArgumentStringLiteral,
	type CompileTimeOperand,
	type ReferenceKind,
	classifyIdentifier,
} from './syntax/parseArgument';

export {
	ArgumentType,
	type Argument,
	type ArgumentCompileTimeExpression,
	type ArgumentIdentifier,
	type ArgumentLiteral,
	type ArgumentStringLiteral,
	type CompileTimeOperand,
	type ReferenceKind,
	classifyIdentifier,
};

type ASTLineBase<Instruction extends string, Arguments extends Array<Argument>> = {
	lineNumberBeforeMacroExpansion: number;
	lineNumberAfterMacroExpansion: number;
	instruction: Instruction;
	arguments: Arguments;
	isSemanticOnly?: boolean;
	isMemoryDeclaration?: boolean;
};

export type ASTLine = ASTLineBase<string, Array<Argument>>;

export type AST = ASTLine[];

export type ParsedLineMetadata = Array<{ callSiteLineNumber: number; macroId?: string }>;

export type PushArgument = ArgumentLiteral | ArgumentIdentifier | ArgumentCompileTimeExpression;
export type PushLine = ASTLineBase<'push', [PushArgument]>;

export type LocalGetLine = ASTLineBase<'localGet', [ArgumentIdentifier]>;
export type LocalSetLine = ASTLineBase<'localSet', [ArgumentIdentifier]>;
export type LocalVariableAccessLine = LocalGetLine | LocalSetLine;

export type BlockLine = ASTLineBase<'block', [ArgumentIdentifier]>;
export type FunctionLine = ASTLineBase<'function', [ArgumentIdentifier]>;
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
export type StoreBytesLine = ASTLineBase<'storeBytes', [ArgumentLiteral]>;
export type WasmLine = ASTLineBase<'wasm', [ArgumentLiteral]>;
export type ConstLine = ASTLineBase<
	'const',
	[ArgumentIdentifier, ArgumentLiteral | ArgumentIdentifier | ArgumentCompileTimeExpression]
>;
export type InitLine = ASTLineBase<
	'init',
	[ArgumentIdentifier, ArgumentLiteral | ArgumentIdentifier | ArgumentCompileTimeExpression]
>;

export type MapValueArgument =
	| ArgumentLiteral
	| ArgumentIdentifier
	| ArgumentCompileTimeExpression
	| ArgumentStringLiteral;
export type MapLine = ASTLineBase<'map', [MapValueArgument, MapValueArgument]>;

export type DefaultLine = ASTLineBase<
	'default',
	[ArgumentLiteral | ArgumentIdentifier | ArgumentCompileTimeExpression]
>;

export type LoopLine = ASTLineBase<'loop', [] | [ArgumentLiteral]>;
export type LoopCapLine = ASTLineBase<'#loopCap', [ArgumentLiteral]>;
