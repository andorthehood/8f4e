import type { AST } from './ast';
import type { ASTCache } from './cache';
import type { FunctionTypeIdentifier } from './functionTypes';
import type { InternalResourceMap, MemoryMap } from './memory';
import type { StackAnalysisResult } from './semantic';

export type CompiledStackAnalysisLine = {
	lineNumberBeforeMacroExpansion: number;
	lineNumberAfterMacroExpansion: number;
	instruction: string;
	stackAnalysis: StackAnalysisResult;
};

export interface CompiledModule {
	index: number;
	initFunctionBody: number[];
	cycleFunction: number[];
	id: string;
	memoryIndex: number;
	memoryRegionName?: string;
	byteAddress: number;
	wordAlignedAddress: number;
	memoryMap: MemoryMap;
	internalResources?: InternalResourceMap;
	wordAlignedSize: number;
	ast?: AST;
	stackAnalysis?: CompiledStackAnalysisLine[];
	skipExecutionInCycle?: boolean;
	initOnlyExecution?: boolean;
}

export type CompiledModuleLookup = Record<string, CompiledModule>;

export type FunctionValueType = FunctionTypeIdentifier;

export interface FunctionSignature {
	parameters: FunctionValueType[];
	returns: FunctionValueType[];
}

export interface FunctionTypeRegistry {
	types: Array<ReturnType<typeof import('@8f4e/compiler-wasm-utils').createFunctionType>>;
	signatureMap: Map<string, number>;
	baseTypeIndex: number;
}

export interface FunctionMetadata {
	id: string;
	signature: FunctionSignature;
	wasmIndex: number;
}

export type FunctionMetadataLookup = Record<string, FunctionMetadata>;

export interface CompiledFunction extends FunctionMetadata {
	body: number[];
	locals: Array<{ isInteger: boolean; count: number }>;
	exportName?: string;
	typeIndex: number;
	ast: AST;
	stackAnalysis?: CompiledStackAnalysisLine[];
}

export type CompiledFunctionLookup = Record<string, CompiledFunction>;

export interface CompilerCache {
	ast: ASTCache;
}

export type CompileResult = {
	codeBuffer: Uint8Array;
	compiledModules: CompiledModuleLookup;
	compiledFunctions?: CompiledFunctionLookup;
	requiredMemoryBytes: number;
	requiredMemoryBytesByRegion?: Record<string, number>;
	cache: CompilerCache;
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
