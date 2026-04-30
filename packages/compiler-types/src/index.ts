import {
	type AST,
	type ASTLine,
	ArgumentType,
	type Argument,
	type ArgumentCompileTimeExpression,
	type BlockBlockMetadata,
	type BlockBlockResultType,
	type BlockEndBlockMetadata,
	type BlockEndLine,
	type BlockLine,
	type BranchIfTrueLine,
	type BranchIfUnchangedLine,
	type BranchLine,
	type CallLine,
	type ConstLine,
	type ConstantsLine,
	type ConstantsEndLine,
	type CompileTimeOperand,
	type DefaultLine,
	type ExitIfTrueLine,
	type FunctionTypeIdentifier,
	type FunctionLine,
	type InitLine,
	type IfBlockMetadata,
	type IfBlockResultType,
	type IfEndBlockMetadata,
	type IfEndLine,
	type IfLine,
	type ArgumentLiteral,
	type ArgumentIdentifier,
	type ArgumentStringLiteral,
	type LocalDeclarationLine,
	type LocalSetLine,
	type LocalVariableAccessLine as TokenizedLocalVariableAccessLine,
	type MapBeginLine,
	type MapEndLine,
	type MapLine,
	type ModuleLine,
	type ModuleEndLine,
	type ParamLine,
	type PushLine,
	type ReferenceKind,
	type StoreBytesLine,
	type UseLine,
	type WasmLine,
	type LoopLine,
	type LoopIndexLine,
	type LoopCapLine,
	type ImpureLine,
} from '@8f4e/tokenizer';

import type { Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';

export enum MemoryTypes {
	'int',
	'int*',
	'int**',
	'int8*',
	'int8**',
	'int16*',
	'int16**',
	'float',
	'float*',
	'float**',
	'float64',
	'float64*',
	'float64**',
}

export interface DataStructure {
	numberOfElements: number;
	elementWordSize: number;
	type: MemoryTypes;
	byteAddress: number;
	wordAlignedSize: number;
	wordAlignedAddress: number;
	default: number | Record<string, number>;
	// lineNumber: number;
	isInteger: boolean;
	isFloat64?: boolean;
	/**
	 * The base type of the pointee. Set only for pointer types (i.e. when `pointeeBaseType !== undefined` the variable holds an address).
	 * Determines load width and value range for dereference operations.
	 * - `'int'` / `'float'` / `'float64'`: standard 32-bit int, 32-bit float, or 64-bit float pointee
	 * - `'int8'` / `'int16'`: narrow signed integer pointee (1 or 2 bytes)
	 * - `'int8u'` / `'int16u'`: narrow unsigned integer pointee (reserved for future use)
	 */
	pointeeBaseType?: 'int' | 'int8' | 'int8u' | 'int16' | 'int16u' | 'float' | 'float64';
	id: string;
	isPointingToPointer: boolean;
	isUnsigned: boolean;
}

export type MemoryMap = Record<string, DataStructure>;

export interface InternalResource {
	id: string;
	byteAddress: number;
	wordAlignedAddress: number;
	wordAlignedSize: number;
	elementWordSize: number;
	default: number;
	storageType: 'int' | 'float' | 'float64';
}

export type InternalResourceMap = Record<string, InternalResource>;

export interface InternalAllocator {
	nextByteAddress: number;
}

export interface CompiledModule {
	index: number;
	initFunctionBody: number[];
	cycleFunction: number[];
	id: string;
	byteAddress: number;
	wordAlignedAddress: number;
	memoryMap: MemoryMap;
	wordAlignedSize: number;
	ast?: AST;
	skipExecutionInCycle?: boolean;
	initOnlyExecution?: boolean;
}

export type CompiledModuleLookup = Record<string, CompiledModule>;

export interface FunctionSignature {
	parameters: FunctionValueType[];
	returns: FunctionValueType[];
}

export interface FunctionTypeRegistry {
	types: Array<ReturnType<typeof import('@8f4e/compiler-wasm-utils').createFunctionType>>;
	signatureMap: Map<string, number>;
	baseTypeIndex: number;
}

export interface CompiledFunction {
	id: string;
	signature: FunctionSignature;
	body: number[];
	locals: Array<{ isInteger: boolean; count: number }>;
	wasmIndex?: number;
	typeIndex?: number;
	ast?: AST;
}

export type CompiledFunctionLookup = Record<string, CompiledFunction>;

export type MemoryBuffer = Int32Array;

export type MemoryReinitReason =
	| { kind: 'no-instance' }
	| { kind: 'memory-size-changed'; prevBytes: number; nextBytes: number }
	| { kind: 'memory-structure-changed' };

export type MemoryAction = { action: 'reused' } | { action: 'recreated'; reason: MemoryReinitReason };

export type GetOrCreateMemoryResult = {
	memoryRef: WebAssembly.Memory;
	memoryAction: MemoryAction;
};

export type GetOrCreateWasmInstanceResult = {
	wasmInstanceRef: WebAssembly.Instance;
	hasWasmInstanceBeenReset: boolean;
};

export type CompileAndUpdateMemoryResult = {
	codeBuffer: Uint8Array;
	compiledModules: CompiledModuleLookup;
	compiledFunctions?: CompiledFunctionLookup;
	requiredMemoryBytes: number;
	allocatedMemoryBytes: number;
	memoryRef: WebAssembly.Memory;
	hasWasmInstanceBeenReset: boolean;
	memoryAction: MemoryAction;
	initOnlyReran: boolean;
};

export type MemoryValueChange = {
	wordAlignedSize: number;
	wordAlignedAddress: number;
	value: number | Record<string, number>;
	isInteger: boolean;
	isFloat64?: boolean;
	elementWordSize: number;
};

export interface Connection {
	fromModuleId: string;
	fromConnectorId: string;
	toModuleId: string;
	toConnectorId: string;
}

export interface Module {
	code: string[];
}

// Export the tokenized AST shapes that form the compiler's public input contract.
export {
	type AST,
	type ASTLine,
	ArgumentType,
	type Argument,
	type ArgumentCompileTimeExpression,
	type BlockBlockMetadata,
	type BlockBlockResultType,
	type BlockEndBlockMetadata,
	type BlockEndLine,
	type BlockLine,
	type BranchIfTrueLine,
	type BranchIfUnchangedLine,
	type BranchLine,
	type CallLine,
	type ConstLine,
	type ConstantsLine,
	type ConstantsEndLine,
	type CompileTimeOperand,
	type DefaultLine,
	type ExitIfTrueLine,
	type FunctionLine,
	type InitLine,
	type IfBlockMetadata,
	type IfBlockResultType,
	type IfEndBlockMetadata,
	type IfEndLine,
	type IfLine,
	type ArgumentLiteral,
	type ArgumentIdentifier,
	type ArgumentStringLiteral,
	type LocalDeclarationLine,
	type LocalSetLine,
	type TokenizedLocalVariableAccessLine,
	type MapBeginLine,
	type MapEndLine,
	type MapLine,
	type ModuleLine,
	type ModuleEndLine,
	type ParamLine,
	type PushLine,
	type ReferenceKind,
	type StoreBytesLine,
	type UseLine,
	type WasmLine,
	type LoopLine,
	type LoopIndexLine,
	type LoopCapLine,
	type ImpureLine,
};

export interface TestModule {
	memory: MemoryBuffer & {
		get: (address: number | string) => number;
		byteAddress: (address: number | string) => number;
		set: (address: number | string, value: number | number[]) => void;
		allocMemoryForPointer: (address: number | string) => number;
	};
	test: CallableFunction;
	reset: () => void;
	wat: string;
	program: Uint8Array;
	memoryMap: MemoryMap;
	ast: AST;
}

export interface MemoryAddressRange {
	source: 'memory-start' | 'memory-end' | 'module-start' | 'module-end' | 'module-nth-memory-start';
	byteAddress: number;
	safeByteLength: number;
	moduleId?: string;
	memoryId?: string;
}

export type Const = { value: number; isInteger: boolean; isFloat64?: boolean; memoryAddress?: MemoryAddressRange };

export type Consts = Record<string, Const>;
export type NormalizedArgumentLiteral = ArgumentLiteral & { memoryAddress?: MemoryAddressRange };
export type FunctionValueType = FunctionTypeIdentifier;
export interface LocalBinding {
	isInteger: boolean;
	isFloat64?: boolean;
	pointeeBaseType?: DataStructure['pointeeBaseType'];
	isPointingToPointer?: boolean;
	index: number;
}
export type LocalMap = Record<string, LocalBinding>;
export interface Namespace {
	memory: MemoryMap;
	consts: Consts;
	moduleName: string | undefined;
	namespaces: Namespaces;
	functions?: CompiledFunctionLookup;
}

export interface CollectedNamespace {
	kind: 'module' | 'constants';
	consts: Consts;
	memory?: MemoryMap;
	byteAddress?: number;
	wordAlignedSize?: number;
}

export type Namespaces = Record<string, CollectedNamespace>;

export type CompilationMode = 'module' | 'function';

export interface CompilationContext {
	namespace: Namespace;
	locals: LocalMap;
	internalResources: InternalResourceMap;
	internalAllocator: InternalAllocator;
	stack: Stack;
	blockStack: BlockStack;
	startingByteAddress: number;
	currentModuleNextWordOffset?: number;
	currentModuleWordAlignedSize?: number;
	byteCode: Array<WASMInstruction | Type | number>;
	mode?: CompilationMode;
	codeBlockId?: string;
	codeBlockType?: 'module' | 'function' | 'constants';
	currentFunctionId?: string;
	currentFunctionSignature?: FunctionSignature;
	currentFunctionIsImpure?: boolean;
	functionTypeRegistry?: FunctionTypeRegistry;
	currentMacroId?: string;
	skipExecutionInCycle?: boolean;
	initOnlyExecution?: boolean;
	/** Current default loop cap for subsequent loops. Defaults to 1000 when not set. */
	loopCap?: number;
}

export interface StackItem {
	isInteger: boolean;
	isFloat64?: boolean;
	pointeeBaseType?: DataStructure['pointeeBaseType'];
	isPointingToPointer?: boolean;
	/** A flag for the div operation to check if the divisor is zero. */
	isNonZero?: boolean;
	/** Exact integer value when the compiler can still prove it at this stack position. */
	knownIntegerValue?: number;
	/** Proven byte range for memory operations when this stack value is known to be an address. */
	memoryAddress?: MemoryAddressRange;
	/** Range an address can be clamped to when pointer arithmetic leaves the proven safe range. */
	memoryAddressRange?: MemoryAddressRange;
	/** Proven access width after an explicit address clamp. */
	safeMemoryAccessByteWidth?: number;
}

export type Stack = StackItem[];

export type ResolvedMapValueArgument = NormalizedArgumentLiteral | ArgumentStringLiteral;
export type NormalizedMapLine = Omit<MapLine, 'arguments'> & {
	arguments: [ResolvedMapValueArgument, ResolvedMapValueArgument];
};
export type NormalizedDefaultLine = Omit<DefaultLine, 'arguments'> & { arguments: [NormalizedArgumentLiteral] };
export type NormalizedConstLine = Omit<ConstLine, 'arguments'> & {
	arguments: [ArgumentIdentifier, NormalizedArgumentLiteral];
};
export type NormalizedInitLine = Omit<InitLine, 'arguments'> & {
	arguments: [ArgumentIdentifier, NormalizedArgumentLiteral | ArgumentIdentifier];
};
export type ArrayDeclarationInstruction =
	| 'float[]'
	| 'int[]'
	| 'int8[]'
	| 'int8u[]'
	| 'int16[]'
	| 'int16u[]'
	| 'int32[]'
	| 'float*[]'
	| 'float**[]'
	| 'int*[]'
	| 'int**[]'
	| 'float64[]'
	| 'float64*[]'
	| 'float64**[]';
export type ArrayDeclarationInitializerArgument =
	| ArgumentCompileTimeExpression
	| ArgumentIdentifier
	| NormalizedArgumentLiteral;
export type ArrayDeclarationLine = Omit<AST[number], 'instruction' | 'arguments'> & {
	instruction: ArrayDeclarationInstruction;
	arguments: [ArgumentIdentifier, ArgumentLiteral, ...ArrayDeclarationInitializerArgument[]];
};
export type NormalizedSemanticInstructionLine =
	| NormalizedConstLine
	| UseLine
	| NormalizedInitLine
	| ModuleLine
	| ModuleEndLine
	| ConstantsLine
	| ConstantsEndLine;
export type ParsedSemanticInstructionLine =
	| ConstLine
	| UseLine
	| InitLine
	| ModuleLine
	| ModuleEndLine
	| ConstantsLine
	| ConstantsEndLine;
export type ParsedLocalVariableAccessLine = TokenizedLocalVariableAccessLine;
export type CodegenLocalSetLine = LocalSetLine;
export type CodegenArgumentLiteral = NormalizedArgumentLiteral;
export type CodegenPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [CodegenArgumentLiteral | ArgumentIdentifier | ArgumentStringLiteral];
};
export type PushIdentifierLine = Omit<PushLine, 'arguments'> & { arguments: [ArgumentIdentifier] };
export type NormalizedLine<TLine extends AST[number]> = TLine extends ConstLine
	? NormalizedConstLine
	: TLine extends InitLine
		? NormalizedInitLine
		: TLine extends DefaultLine
			? NormalizedDefaultLine | DefaultLine
			: TLine extends MapLine
				? NormalizedMapLine | MapLine
				: TLine extends LocalSetLine
					? CodegenLocalSetLine
					: TLine extends PushLine
						? CodegenPushLine
						: TLine extends ArrayDeclarationLine
							? ArrayDeclarationLine
							: TLine;

export enum BLOCK_TYPE {
	MODULE,
	LOOP,
	CONDITION,
	FUNCTION,
	BLOCK,
	CONSTANTS,
	MAP,
}

export interface MapRow {
	keyValue: number;
	valueValue: number;
	valueIsInteger: boolean;
	valueIsFloat64?: boolean;
}

export interface MapBlockState {
	inputIsInteger: boolean;
	inputIsFloat64: boolean;
	rows: MapRow[];
	defaultValue?: number;
	defaultIsInteger?: boolean;
	defaultIsFloat64?: boolean;
	defaultSet: boolean;
}

export type BlockStack = Array<{
	expectedResultIsInteger: boolean;
	hasExpectedResult: boolean;
	blockType: BLOCK_TYPE;
	loopCounterLocalName?: string;
	mapState?: MapBlockState;
}>;

export type InstructionCompiler<TLine extends AST[number] = AST[number]> = ((
	line: TLine,
	context: CompilationContext
) => CompilationContext) &
	((line: AST[number], context: CompilationContext) => CompilationContext);

/**
 * Internal compiler-stage error shape returned by getError().
 * This is not the public cross-stage contract; consumers should use CompilerDiagnostic.
 */
export interface CompilerStageError {
	message: string;
	line: Parameters<InstructionCompiler>[0];
	context?: CompilationContext;
	code: number;
}

/**
 * The shared, serializable diagnostic shape exposed to all consumers of the compiler pipeline.
 * Both syntax errors (SyntaxRulesError) and semantic/compiler errors conform to this contract
 * once serialized. Consumers must not special-case either stage.
 */
export interface CompilerDiagnosticLine {
	lineNumberBeforeMacroExpansion: number;
	lineNumberAfterMacroExpansion: number;
	instruction?: string;
	arguments?: unknown[];
}

export interface CompilerDiagnosticContext {
	codeBlockId?: string;
	codeBlockType?: 'module' | 'function' | 'constants';
}

export interface CompilerDiagnostic {
	/** Numeric ErrorCode for compiler errors; SyntaxErrorCode string for syntax errors. */
	code: number | string;
	message: string;
	line: CompilerDiagnosticLine;
	context: CompilerDiagnosticContext;
}

export interface CompileOptions {
	startingMemoryWordAddress?: number;
	globalDataStructures?: DataStructure[];
	/** Whether to include AST in compiled modules. Default is false to reduce payload size. */
	includeAST?: boolean;
	/** Disable shared memory for tests (wabt doesn't support shared memory). Default is false (shared enabled). */
	disableSharedMemory?: boolean;
	/** Buffer size for the buffer function. Default is 128. */
	bufferSize?: number;
	/** Buffer generation strategy: 'loop' (default, smaller code size) or 'unrolled' (potentially faster). */
	bufferStrategy?: 'loop' | 'unrolled';
}

export type Instruction =
	| 'and'
	| 'or'
	| 'load'
	| 'load8u'
	| 'load16u'
	| 'load8s'
	| 'load16s'
	| 'clampAddress'
	| 'clampModuleAddress'
	| 'clampGlobalAddress'
	| 'localSet'
	| 'else'
	| 'if'
	| 'ifEnd'
	| 'lessThan'
	| 'store'
	| 'sub'
	| 'div'
	| 'xor'
	| 'local'
	| 'greaterOrEqual'
	| 'add'
	| 'greaterThan'
	| 'branch'
	| 'branchIfTrue'
	| 'exitIfTrue'
	| 'push'
	| 'block'
	| 'blockEnd'
	| 'lessOrEqual'
	| 'mul'
	| 'loop'
	| 'loopIndex'
	| 'loopEnd'
	| 'greaterOrEqualUnsigned'
	| 'equalToZero'
	| 'notEqual'
	| 'notZero'
	| 'shiftLeft'
	| 'shiftRight'
	| 'shiftRightUnsigned'
	| 'remainder'
	| 'castToInt'
	| 'castToFloat'
	| 'castToFloat64'
	| 'drop'
	| 'clearStack'
	| 'risingEdge'
	| 'fallingEdge'
	| 'hasChanged'
	| 'dup'
	| 'swap'
	| 'cycle'
	| 'abs'
	| 'equal'
	| 'wasm'
	| 'branchIfUnchanged'
	| 'pow2'
	| 'sqrt'
	| 'loadFloat'
	| 'round'
	| 'ensureNonZero'
	| 'function'
	| 'functionEnd'
	| 'return'
	| 'param'
	| 'call'
	| '#skipExecution'
	| '#initOnly'
	| '#impure'
	| '#loopCap'
	| 'mapBegin'
	| 'map'
	| 'default'
	| 'mapEnd'
	| 'storeBytes';

export interface ExpandedLine {
	line: string;
	callSiteLineNumber: number;
	macroId?: string;
}

export interface MacroDefinition {
	name: string;
	body: string[];
	definitionLineNumber: number;
}
