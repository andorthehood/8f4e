import { serializeDiagnostic } from '@8f4e/compiler';

import compileAndUpdateMemory from './compileAndUpdateMemory';

import type { CompileOptions, Module } from '@8f4e/compiler-types';

async function compile(modules: Module[], compilerOptions: CompileOptions, functions?: Module[], macros?: Module[]) {
	try {
		const {
			codeBuffer,
			compiledModules,
			compiledFunctions,
			requiredMemoryBytes,
			allocatedMemoryBytes,
			astCacheStats,
			memoryRef,
			hasWasmInstanceBeenReset,
			memoryAction,
			initOnlyReran,
		} = await compileAndUpdateMemory(modules, compilerOptions, functions, macros);
		self.postMessage({
			type: 'success',
			payload: {
				codeBuffer,
				compiledModules,
				requiredMemoryBytes,
				allocatedMemoryBytes,
				astCacheStats,
				wasmMemory: memoryRef,
				hasWasmInstanceBeenReset,
				compiledFunctions,
				memoryAction,
				initOnlyReran,
			},
		});
	} catch (error) {
		self.postMessage({
			type: 'compilationError',
			payload: serializeDiagnostic(error),
		});
	}
}

self.onmessage = function (event) {
	switch (event.data.type) {
		case 'compile':
			compile(
				event.data.payload.modules,
				event.data.payload.compilerOptions,
				event.data.payload.functions,
				event.data.payload.macros
			);
			break;
	}
};
