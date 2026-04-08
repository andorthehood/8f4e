import {
	type AST,
	type ASTLine,
	ArgumentType,
	type Argument,
	type ArgumentCompileTimeExpression,
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
	type LoopCapLine,
} from '@8f4e/tokenizer';
import { Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';

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
	parameters: Array<'int' | 'float' | 'float64'>;
	returns: Array<'int' | 'float' | 'float64'>;
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

export interface Connection {
	fromModuleId: string;
	fromConnectorId: string;
	toModuleId: string;
	toConnectorId: string;
}

export interface Module {
	code: string[];
}

// Re-export types from syntax subpath for backward compatibility
export {
	type AST,
	type ASTLine,
	ArgumentType,
	type Argument,
	type ArgumentCompileTimeExpression,
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
	type LoopCapLine,
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

export type Const = { value: number; isInteger: boolean; isFloat64?: boolean };

export type Consts = Record<string, Const>;
export type LocalMap = Record<string, { isInteger: boolean; isFloat64?: boolean; index: number }>;
export interface Namespace {
	memory: MemoryMap;
	consts: Consts;
	moduleName: string | undefined;
	namespaces: Namespaces;
	functions?: CompiledFunctionLookup;
}

export type Namespaces = Record<
	string,
	{ consts: Consts; memory?: MemoryMap; byteAddress?: number; wordAlignedSize?: number }
>;

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
	/** A flag for the div operation to check if the divisor is zero. */
	isNonZero?: boolean;
	/** A flag for the memory opraions to check if the memory address is within the memory bounds. */
	isSafeMemoryAddress?: boolean;
}

export type Stack = StackItem[];

export type ResolvedMapValueArgument = ArgumentLiteral | ArgumentStringLiteral;
export type NormalizedMapLine = Omit<MapLine, 'arguments'> & {
	arguments: [ResolvedMapValueArgument, ResolvedMapValueArgument];
};
export type NormalizedDefaultLine = Omit<DefaultLine, 'arguments'> & { arguments: [ArgumentLiteral] };
export type NormalizedConstLine = Omit<ConstLine, 'arguments'> & { arguments: [ArgumentIdentifier, ArgumentLiteral] };
export type NormalizedInitLine = Omit<InitLine, 'arguments'> & {
	arguments: [ArgumentIdentifier, ArgumentLiteral | ArgumentIdentifier];
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
export type ArrayDeclarationLine = Omit<AST[number], 'instruction' | 'arguments'> & {
	instruction: ArrayDeclarationInstruction;
	arguments: [ArgumentIdentifier, ArgumentLiteral];
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
export type CodegenPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [ArgumentLiteral | ArgumentIdentifier | ArgumentStringLiteral];
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
	mapState?: MapBlockState;
}>;

export type InstructionCompiler<TLine extends AST[number] = AST[number]> = ((
	line: TLine,
	context: CompilationContext
) => CompilationContext) &
	((line: AST[number], context: CompilationContext) => CompilationContext);

export interface Error {
	message: string;
	line: Parameters<InstructionCompiler>[0];
	context?: CompilationContext;
	code: number;
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
