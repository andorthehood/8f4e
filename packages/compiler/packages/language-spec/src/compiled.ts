import type { FunctionType, WasmTypeValue } from '@8f4e/compiler-wasm-utils';
import type { ValidatedAST, ValidatedFunctionAST, ValidatedModuleAST } from './ast';
import type { ASTCache } from './cache';
import type { FunctionImportMetadata, FunctionSignature, FunctionValueType } from './functionTypes';
import type { MemoryDefaults, MemoryLayoutPlan, MemoryPointerMetadataMap } from './memory';
import type { StackAnalysisResult } from './semantic';

export type CompiledStackAnalysisLine = {
	lineNumber: number;
	instruction: string;
	stackAnalysis: StackAnalysisResult;
};

/** Code generation output and metadata for a compiled executable module. */
export interface CompiledModule {
	index: number;
	cycleFunction: number[];
	id: string;
	executionEntryName?: string;
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
	used?: boolean;
	typeIndex: number;
	ast: ValidatedFunctionAST;
	stackAnalysis?: CompiledStackAnalysisLine[];
}

export type CompiledFunctionLookup = Record<string, CompiledFunction>;

/** Reusable compiler caches returned from a compile operation. */
export interface CompilerCache {
	ast: ASTCache<ValidatedAST>;
}

/**
 * Emission-ready output produced by compiling one closed source sub-program.
 *
 * Function indexes and memory addresses are assigned within this unit. A future
 * binary composer will need relocation metadata before multiple values of this
 * type can be linked into one WebAssembly module without recompilation.
 */
export interface CompiledSubProgram {
	/** Public execution entries owned by this sub-program. */
	entryNames: string[];
	/** Compiled module bodies in source order. */
	compiledModules: CompiledModule[];
	/** Compiled user functions in source order. */
	compiledFunctions: CompiledFunction[];
	/** Function type table accumulated while compiling calls and definitions. */
	functionTypeRegistry: FunctionTypeRegistry;
	/** Memory layout assigned within this sub-program. */
	memoryPlan: MemoryLayoutPlan;
	/** Resolved memory defaults keyed by module id. */
	memoryDefaultsByModuleId: Record<string, MemoryDefaults>;
	/** Resolved pointer metadata keyed by module id. */
	pointerMetadataByModuleId: Record<string, MemoryPointerMetadataMap>;
	/** Cache carrying validated AST entries for this compilation. */
	cache: CompilerCache;
}

export type CompileResult = {
	codeBuffer: Uint8Array;
	compiledModules: CompiledModuleLookup;
	compiledFunctions?: CompiledFunctionLookup;
	memoryPlan: MemoryLayoutPlan;
	memoryDefaultsByModuleId: Record<string, MemoryDefaults>;
	pointerMetadataByModuleId: Record<string, MemoryPointerMetadataMap>;
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

/** Compiler-derived source payload used between private compiler stages. */
export interface Module {
	/** Raw source lines for a compiler-derived block such as an included function. */
	code: string[];
	/** Optional project block id used to map diagnostics back to editor/project source. */
	projectBlockId?: number;
	/** Optional origin metadata for blocks expanded before compilation. */
	source?: SourceMetadata;
}
