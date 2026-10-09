import type { AssertionImportName } from './assertions';
import type { FunctionImportMetadata } from './functionTypes';

/** One host function import in the emitted import-section order. */
export interface WasmFunctionImport extends FunctionImportMetadata {
	typeIndex: number;
}

/** Final WebAssembly function and signature indices, separate from source symbols. */
export interface WasmFunctionMetadata {
	wasmIndex: number;
	typeIndex: number;
}

/** Complete function layout assigned once after semantic and assertion analysis. */
export interface WasmFunctionLayout {
	imports: WasmFunctionImport[];
	functions: Record<string, WasmFunctionMetadata>;
	assertionCallbacks: ReadonlyMap<AssertionImportName, number>;
	initDefaultsIndex: number;
	moduleFunctionIndices: Record<string, number>;
}
