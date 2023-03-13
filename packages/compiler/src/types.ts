import { Instruction } from './instructions';
import Type from './wasmUtils/type';
import WASMInstruction from './wasmUtils/wasmInstruction';

export enum MemoryTypes {
	ARRAY,
	WORD,
}

export interface MemoryItem {
	type: MemoryTypes;
	relativeWordAddress: number;
	byteAddress: number;
	wordSize: number;
	wordAddress: number;
	default: number | number[];
	lineNumber: number;
	isInteger: boolean;
	id: string;
}

export type MemoryMap = Map<string, MemoryItem>;

export interface CompiledModule {
	functionBody: number[];
	id: string;
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

export interface Module {
	code: string[];
}

export type MemoryAddressLookup = Map<string, number>;

export const enum ArgumentType {
	LITERAL = 'literal',
	IDENTIFIER = 'identifier',
}

export type ArgumentLiteral = { type: ArgumentType.LITERAL; value: number; isInteger: boolean };
export type ArgumentIdentifier = { type: ArgumentType.IDENTIFIER; value: string };

export type Argument = ArgumentLiteral | ArgumentIdentifier;

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

export interface Namespace {
	locals: string[];
	memory: MemoryMap;
	consts: Record<string, { value: number; isInteger: boolean }>;
}

export interface StackItem {
	isInteger: boolean;
}

export type Stack = StackItem[];

export type InstructionHandler = (
	line: AST[number],
	namespace: Namespace,
	stack: Stack,
	startingByteAddress: number
) => { namespace: Namespace; byteCode: Array<WASMInstruction | Type | number>; stack: Stack };

export interface Error {
	message: string;
	line: Partial<AST[number]>;
	code: number;
}
