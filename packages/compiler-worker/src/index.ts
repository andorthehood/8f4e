import { serializeDiagnostic } from '@8f4e/compiler';
import type { CompileOptions, ProjectObjectModel } from '@8f4e/language-spec';
import compileAndUpdateMemory from './compileAndUpdateMemory';

async function compile(
	project: ProjectObjectModel,
	compilerOptions: CompileOptions,
	includeSources: Record<string, string | undefined>
) {
	try {
		const {
			codeBuffer,
			compiledModules,
			compiledFunctions,
			memoryPlan,
			memoryDefaultsByModuleId,
			pointerMetadataByModuleId,
			projectMemoryExposuresByGroupPath,
			requiredMemoryBytes,
			allocatedMemoryBytes,
			astCacheStats,
			memoryRef,
			hasWasmInstanceBeenReset,
			memoryAction,
			initOnlyReran,
		} = await compileAndUpdateMemory(project, compilerOptions, includeSources);
		self.postMessage({
			type: 'success',
			payload: {
				codeBuffer,
				compiledModules,
				memoryPlan,
				memoryDefaultsByModuleId,
				pointerMetadataByModuleId,
				projectMemoryExposuresByGroupPath,
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
			compile(event.data.payload.project, event.data.payload.compilerOptions, event.data.payload.includeSources);
			break;
	}
};
