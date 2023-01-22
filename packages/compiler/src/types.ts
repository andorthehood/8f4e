import Type from './wasmUtils/type';
import WASMInstruction from './wasmUtils/wasmInstruction';

export enum MemoryTypes {
	DYNAMIC_ARRAY,
	STATIC_ARRAY,
	ARRAY_SIZE,
	INPUT_POINTER,
	OUTPUT,
	PRIVATE,
	NUMBER,
	ARRAY,
}

export type MemoryMap = Map<
	string,
	{
		type: MemoryTypes;
		relativeWordAddress: number;
		byteAddress: number;
		wordSize: number;
		default: number | number[];
	}
>;

export interface CompiledModule {
	functionBody: number[];
	moduleId: string;
	byteAddress: number;
	wordAddress: number;
	memoryMap: MemoryMap;
	memoryWordSize: number;
	ast: AST;
}

export type CompiledModuleLookup = Map<string, CompiledModule>;

export type MemoryBuffer = Int32Array;

export interface Connection {
	fromModuleId: string;
	fromConnectorId: string;
	toModuleId: string;
	toConnectorId: string;
}

export type ModuleStateExtractor<T> = (memoryBuffer: MemoryBuffer, moduleAddress: number) => T;
export type ModuleStateInserter<T> = (moduleState: T, memoryBuffer: MemoryBuffer, moduleAddress: number) => void;

export interface Module<ModuleState = Record<string, any>> {
	id: string;
	code: string[];
	state: ModuleState;
}

export type MemoryAddressLookup = Map<string, number>;

export const enum ArgumentType {
	LITERAL = 'literal',
	IDENTIFIER = 'identifier',
}

export type Argument = { type: ArgumentType.LITERAL; value: number } | { type: ArgumentType.IDENTIFIER; value: string };

export type AST = Array<{ lineNumber: number; instruction: string; arguments: Array<Argument> }>;

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
}

export interface Namespace {
	locals: string[];
	memory: MemoryMap;
	consts: Record<string, number>;
}

export type InstructionHandler = (
	line: AST[number],
	namespace: Namespace,
	startingByteAddress: number
) => { namespace: Namespace; byteCode: Array<WASMInstruction | Type | number> };
