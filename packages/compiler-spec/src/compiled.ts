import type { FunctionType, WasmTypeValue } from '@8f4e/compiler-wasm-utils';
import type { AST, ConstantsAST, FunctionAST, ModuleAST } from './ast';
import type { ASTCache } from './cache';
import type { FunctionSignature } from './functionTypes';
import type { InternalResourceMap, MemoryMap } from './memory';
import type { StackAnalysisResult } from './semantic';

export type CompiledStackAnalysisLine = {
	lineNumberBeforeMacroExpansion: number;
	lineNumberAfterMacroExpansion: number;
	instruction: string;
	stackAnalysis: StackAnalysisResult;
};

/** Code generation output and metadata for a compiled module or constants block. */
export interface CompiledModule {
	index: number;
	initFunctionBody: number[];
	cycleFunction: number[];
	id: string;
	memoryIndex: number;
	memoryRegionName?: string;
	byteAddress: number;
	allocationUnitAddress: number;
	memoryMap: MemoryMap;
	internalResources?: InternalResourceMap;
	allocationUnitCount: number;
	ast?: ModuleAST | ConstantsAST;
	stackAnalysis?: CompiledStackAnalysisLine[];
	skipExecutionInCycle?: boolean;
	initOnlyExecution?: boolean;
}

export type CompiledModuleLookup = Record<string, CompiledModule>;

/** WebAssembly parameter and result types for a function signature. */
export interface FunctionTypeSignature {
	params: WasmTypeValue[];
	results: WasmTypeValue[];
}

/** Function type signature together with its index in the emitted type section. */
export interface RegisteredFunctionTypeSignature extends FunctionTypeSignature {
	typeIndex: number;
}

/** Registry of WebAssembly function types used while emitting a module. */
export interface FunctionTypeRegistry {
	types: FunctionType[];
	signatures: RegisteredFunctionTypeSignature[];
	baseTypeIndex: number;
}

/** Public identity, signature, and WebAssembly index for a compiled function. */
export interface FunctionMetadata {
	id: string;
	signature: FunctionSignature;
	wasmIndex: number;
}

export type FunctionMetadataLookup = Record<string, FunctionMetadata>;

/** Code generation output and metadata for a compiled function. */
export interface CompiledFunction extends FunctionMetadata {
	body: number[];
	locals: Array<{ isInteger: boolean; count: number }>;
	exportName?: string;
	typeIndex: number;
	ast: FunctionAST;
	stackAnalysis?: CompiledStackAnalysisLine[];
}

export type CompiledFunctionLookup = Record<string, CompiledFunction>;

/** Reusable compiler caches returned from a compile operation. */
export interface CompilerCache {
	ast: ASTCache<AST>;
}

export type CompileResult = {
	codeBuffer: Uint8Array;
	compiledModules: CompiledModuleLookup;
	compiledFunctions?: CompiledFunctionLookup;
	requiredMemoryBytes: number;
	requiredMemoryBytesByRegion?: Record<string, number>;
	cache: CompilerCache;
};

/** Directed connection between two module connectors in an editor graph. */
export interface Connection {
	fromModuleId: string;
	fromConnectorId: string;
	toModuleId: string;
	toConnectorId: string;
}

/** Source module payload consumed by the compiler. */
export interface Module {
	code: string[];
}
