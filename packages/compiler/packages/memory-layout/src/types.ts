import type { AST } from '@8f4e/tokenizer';

export { type AST } from '@8f4e/tokenizer';

export const GLOBAL_ALIGNMENT_BOUNDARY = 4;

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
	isInteger: boolean;
	isFloat64?: boolean;
	pointeeBaseType?: 'int' | 'int8' | 'int8u' | 'int16' | 'int16u' | 'float' | 'float64';
	id: string;
	isPointingToPointer: boolean;
	isUnsigned: boolean;
}

export type MemoryMap = Record<string, DataStructure>;
export type Const = { value: number; isInteger: boolean; isFloat64?: boolean };
export type Consts = Record<string, Const>;

export interface PublicMemoryNamespace {
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

export interface CompiledFunctionLookup {
	[id: string]: {
		id: string;
		signature: unknown;
		body: number[];
		locals: unknown[];
		wasmIndex?: number;
		typeIndex?: number;
		ast?: AST;
	};
}

export enum BLOCK_TYPE {
	MODULE,
	CONSTANTS,
}

export interface PublicMemoryLayoutContext {
	namespace: PublicMemoryNamespace;
	startingByteAddress: number;
	currentModuleNextWordOffset?: number;
	currentModuleWordAlignedSize?: number;
	blockStack: Array<{
		blockType: BLOCK_TYPE;
		hasExpectedResult: boolean;
		expectedResultIsInteger: boolean;
	}>;
	codeBlockId?: string;
	codeBlockType?: 'module' | 'function' | 'constants';
}

export interface PublicMemoryLayoutModule {
	index: number;
	id: string;
	byteAddress: number;
	wordAlignedAddress: number;
	wordAlignedSize: number;
	memoryMap: MemoryMap;
}

export interface PublicMemoryLayout {
	modules: Record<string, PublicMemoryLayoutModule>;
	namespaces: Namespaces;
	requiredPublicMemoryBytes: number;
}

export enum ErrorCode {
	INSUFFICIENT_OPERANDS,
	UNMATCHING_OPERANDS,
	ONLY_INTEGERS,
	ONLY_FLOATS,
	MISSING_ARGUMENT,
	UNDECLARED_IDENTIFIER,
	EXPECTED_IDENTIFIER,
	UNRECOGNISED_INSTRUCTION,
	EXPECTED_VALUE,
	MISSING_MODULE_ID,
	UNKNOWN_ERROR,
	STACK_EXPECTED_ZERO_ELEMENTS,
	MISSING_BLOCK_START_INSTRUCTION,
	INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	DIVISION_BY_ZERO,
	MISSING_FUNCTION_ID,
	INVALID_FUNCTION_SIGNATURE,
	FUNCTION_SIGNATURE_OVERFLOW,
	STACK_MISMATCH_FUNCTION_RETURN,
	TYPE_MISMATCH,
	MEMORY_ACCESS_IN_PURE_FUNCTION,
	UNDEFINED_FUNCTION,
	PARAM_AFTER_FUNCTION_BODY,
	DUPLICATE_PARAMETER_NAME,
	INSTRUCTION_MUST_BE_TOP_LEVEL,
	DUPLICATE_MACRO_NAME,
	MISSING_MACRO_END,
	UNDEFINED_MACRO,
	NESTED_MACRO_DEFINITION,
	NESTED_MACRO_CALL,
	COMPILER_DIRECTIVE_INVALID_CONTEXT,
	MIXED_FLOAT_WIDTH,
	INSTRUCTION_NOT_ALLOWED_IN_BLOCK,
	SPLIT_HEX_TOO_MANY_BYTES,
	SPLIT_HEX_MIXED_TOKENS,
	CONSTANT_NAME_AS_MEMORY_IDENTIFIER,
	RESERVED_MEMORY_IDENTIFIER,
	SPLIT_BYTE_CONSTANT_OUT_OF_RANGE,
	POINTEE_WORD_SIZE_ON_NON_POINTER,
	POINTEE_ELEMENT_MAX_ON_NON_POINTER,
	RETURN_OUTSIDE_FUNCTION,
	LOCAL_NAME_COLLISION_WITH_MEMORY,
	DUPLICATE_IDENTIFIER,
}
