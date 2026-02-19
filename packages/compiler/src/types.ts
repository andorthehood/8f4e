import { ArgumentType, type Argument, type ArgumentLiteral, type ArgumentIdentifier } from './syntax/parseArgument';
import { Instruction } from './instructionCompilers';
import Type from './wasmUtils/type';
import WASMInstruction from './wasmUtils/wasmInstruction';

export enum MemoryTypes {
	'int',
	'int*',
	'int**',
	'float',
	'float*',
	'float**',
	'float64',
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
	id: string;
	isPointer: boolean;
	isPointingToInteger: boolean;
	isPointingToPointer: boolean;
	isUnsigned: boolean;
}

export type MemoryMap = Record<string, DataStructure>;

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
	parameters: Array<'int' | 'float'>;
	returns: Array<'int' | 'float'>;
}

export interface FunctionTypeRegistry {
	types: Array<ReturnType<typeof import('./wasmUtils/typeFunction/createFunctionType').default>>;
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
export { ArgumentType, type Argument, type ArgumentLiteral, type ArgumentIdentifier };

export type AST = Array<{ lineNumber: number; instruction: Instruction; arguments: Array<Argument> }>;

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

export type Const = { value: number; isInteger: boolean };

export type Consts = Record<string, Const>;
export interface Namespace {
	locals: Record<string, { isInteger: boolean; index: number }>;
	memory: MemoryMap;
	consts: Consts;
	moduleName: string | undefined;
	namespaces: Namespaces;
	functions?: CompiledFunctionLookup;
}

export type Namespaces = Record<string, { consts: Consts }>;

export type CompilationMode = 'module' | 'function';

export interface CompilationContext {
	namespace: Namespace;
	stack: Stack;
	blockStack: BlockStack;
	startingByteAddress: number;
	memoryByteSize: number;
	byteCode: Array<WASMInstruction | Type | number>;
	mode?: CompilationMode;
	currentFunctionId?: string;
	currentFunctionSignature?: FunctionSignature;
	functionTypeRegistry?: FunctionTypeRegistry;
	currentMacroId?: string;
	skipExecutionInCycle?: boolean;
	initOnlyExecution?: boolean;
}

export interface StackItem {
	isInteger: boolean;
	/** A flag for the div operation to check if the divisor is zero. */
	isNonZero?: boolean;
	/** A flag for the memory opraions to check if the memory address is within the memory bounds. */
	isSafeMemoryAddress?: boolean;
}

export type Stack = StackItem[];

export enum BLOCK_TYPE {
	MODULE,
	LOOP,
	CONDITION,
	FUNCTION,
	BLOCK,
	CONSTANTS,
}

export type BlockStack = Array<{
	expectedResultIsInteger: boolean;
	hasExpectedResult: boolean;
	blockType: BLOCK_TYPE;
}>;

export type InstructionCompiler = (line: AST[number], context: CompilationContext) => CompilationContext;

export interface Error {
	message: string;
	line: Parameters<InstructionCompiler>[0];
	context?: CompilationContext;
	code: number;
}

export interface CompileOptions {
	startingMemoryWordAddress: number;
	/** Memory size in bytes. */
	memorySizeBytes: number;
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
