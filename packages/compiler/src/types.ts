import { Instruction } from './instructions';
import Type from './wasmUtils/type';
import WASMInstruction from './wasmUtils/wasmInstruction';

export enum MemoryTypes {
	'int',
	'int*',
	'int**',
	'float',
	'float*',
	'float**',
}

export interface MemoryItem {
	type: MemoryTypes;
	byteAddress: number;
	wordSize: number;
	wordAddress: number;
	default: number | number[];
	lineNumber: number;
	isInteger: boolean;
	id: string;
	isPointer: boolean;
	isPointingToInteger: boolean;
	isPointingToPointer: boolean;
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

export type Const = { value: number; isInteger: boolean };

export type Consts = Record<string, Const>;
export interface Namespace {
	locals: Map<string, { isInteger: boolean; index: number }>;
	memory: MemoryMap;
	consts: Consts;
	moduleName: string | undefined;
	namespaces: Namespaces;
}

export type Namespaces = Map<string, { consts: Consts }>;
export interface CompilationContext {
	namespace: Namespace;
	stack: Stack;
	blockStack: BlockStack;
	startingByteAddress: number;
}

export interface StackItem {
	isInteger: boolean;
}

export type Stack = StackItem[];

export type BlockStack = Array<{
	expectedResultIsInteger: boolean;
	hasExpectedResult: boolean;
	isModuleBlock: boolean;
	isGroupBlock: boolean;
	isLoop: boolean;
}>;

export type InstructionHandler = (
	line: AST[number],
	context: CompilationContext
) => { context: CompilationContext; byteCode: Array<WASMInstruction | Type | number> };

export interface Error {
	message: string;
	line: Parameters<InstructionHandler>[0];
	context?: CompilationContext;
	code: number;
}

export interface CompileOptions {
	startingMemoryWordAddress: number;
	environmentExtensions: {
		constants: Namespace['consts'];
		ignoredKeywords: string[];
	};
}
