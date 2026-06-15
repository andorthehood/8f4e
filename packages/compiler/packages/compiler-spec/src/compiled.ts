import type { FunctionType, WasmTypeValue } from '@8f4e/compiler-wasm-utils';
import type { ValidatedAST, ValidatedFunctionAST, ValidatedModuleAST } from './ast';
import type { ASTCache } from './cache';
import type { FunctionImportMetadata, FunctionSignature, FunctionValueType } from './functionTypes';
import type { MemoryMap } from './memory';
import type { StackAnalysisResult } from './semantic';

export type CompiledStackAnalysisLine = {
	lineNumber: number;
	instruction: string;
	stackAnalysis: StackAnalysisResult;
};

/** Code generation output and metadata for a compiled executable module. */
export interface CompiledModule {
	index: number;
	initFunctionBody: number[];
	cycleFunction: number[];
	id: string;
	executionEntryName?: string;
	memoryIndex: number;
	memoryRegionName?: string;
	byteAddress: number;
	wordAlignedAddress: number;
	memoryMap: MemoryMap;
	wordAlignedSize: number;
	ast: ValidatedModuleAST;
	stackAnalysis?: CompiledStackAnalysisLine[];
	skipExecutionInCycle?: boolean;
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
export interface FunctionParamShapeExpansion {
	lineNumber: number;
	parameters: Array<{
		name: string;
		type: FunctionValueType;
	}>;
}

export interface FunctionMetadata {
	/** Canonical compiler identity for this concrete function. */
	id: string;
	/** Source-level callable name written by the user. */
	name: string;
	signature: FunctionSignature;
	wasmIndex: number;
	/** Whether a resolved call instruction has marked this concrete overload as used. */
	used?: boolean;
	import?: FunctionImportMetadata;
	paramShapeExpansions?: FunctionParamShapeExpansion[];
}

export type FunctionMetadataLookup = Record<string, FunctionMetadata>;

/** Function metadata indexed by compiler id, plus source-name arity metadata for calls. */
export interface FunctionRegistry {
	byId: FunctionMetadataLookup;
	arityByName: Record<string, number>;
}

/** Code generation output and metadata for a compiled function. */
export interface CompiledFunction extends FunctionMetadata {
	body: number[];
	locals: Array<{ isInteger: boolean; count: number }>;
	exportName?: string;
	typeIndex: number;
	ast: ValidatedFunctionAST;
	stackAnalysis?: CompiledStackAnalysisLine[];
}

export type CompiledFunctionLookup = Record<string, CompiledFunction>;

/** Reusable compiler caches returned from a compile operation. */
export interface CompilerCache {
	ast: ASTCache<ValidatedAST>;
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

/** Source origin for blocks expanded from built-in or external includes. */
export interface IncludedSourceMetadata {
	kind: 'include';
	includeId: string;
	symbolName: string;
}

/** Source origin metadata carried with source blocks. */
export type SourceMetadata = IncludedSourceMetadata;

/**
 * Basic source block payload consumed by the compiler.
 *
 * The compiler receives only irreducible source blocks: modules, functions,
 * constants, and prototypes. Project-level conveniences such as includes are
 * expanded by a preparser before this boundary and appear here as function
 * blocks with optional source metadata.
 */
export interface Module {
	/** Raw source lines for one module, function, constants, or prototype block. */
	code: string[];
	/** Optional project block id used to map diagnostics back to editor/project source. */
	projectBlockId?: number;
	/** Optional origin metadata for blocks expanded before compilation. */
	source?: SourceMetadata;
}

/** Executable module blocks partitioned by host-callable execution entry. */
export type ModuleEntries = Record<string, Module[]>;

/**
 * Complete source payload consumed by the compiler.
 *
 * These four collections are the compiler's basic building blocks:
 * executable modules grouped by entry, shared functions, constants, and
 * prototypes. Includes are not a basic compiler block type; callers should
 * resolve them into function blocks before creating this input.
 */
export interface CompileInput {
	/** Executable module blocks grouped by host-callable entry name. */
	entries: ModuleEntries;
	/** Shared function blocks, including functions expanded from includes. */
	functions: Module[];
	/** Top-level constants blocks. */
	constants: Module[];
	/** Prototype blocks used by shape/state layouts. */
	prototypes: Module[];
}
