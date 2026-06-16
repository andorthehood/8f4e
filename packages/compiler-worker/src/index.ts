import { serializeDiagnostic } from '@8f4e/compiler';
import type { CompileInput, CompileOptions } from '@8f4e/language-spec';
import compileAndUpdateMemory from './compileAndUpdateMemory';

async function compile(input: CompileInput, compilerOptions: CompileOptions) {
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
		} = await compileAndUpdateMemory(input, compilerOptions);
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

self.onmessage = event => {
	switch (event.data.type) {
		case 'compile':
			compile(event.data.payload.input, event.data.payload.compilerOptions);
			break;
	}
};
