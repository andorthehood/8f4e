import { serializeDiagnostic } from '@8f4e/compiler';
import type { CompileOptions, ProjectObjectModel } from '@8f4e/language-spec';
import compileAndUpdateMemory from './compileAndUpdateMemory';
import { createIncludeSourceCache } from './includeSourceCache';
import { createIncludeSourceRequestBroker } from './includeSourceRequestBroker';
import type { ResolveIncludeResultMessage } from './messages';

const includeSourceCache = createIncludeSourceCache();
const includeSourceRequestBroker = createIncludeSourceRequestBroker(message => self.postMessage(message));

async function compile(project: ProjectObjectModel, compilerOptions: CompileOptions, compilationId: number) {
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
		} = await compileAndUpdateMemory(project, compilerOptions, includeId =>
			includeSourceCache.resolve(includeId, () => includeSourceRequestBroker.request(includeId))
		);
		self.postMessage({
			type: 'success',
			compilationId,
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
			compilationId,
			payload: serializeDiagnostic(error),
		});
	}
}

self.onmessage = event => {
	switch (event.data.type) {
		case 'compile':
			compile(event.data.payload.project, event.data.payload.compilerOptions, event.data.compilationId);
			break;
		case 'resolveIncludeResult':
			includeSourceRequestBroker.finish(event.data as ResolveIncludeResultMessage);
			break;
	}
};

export type { ResolveIncludeRequestMessage, ResolveIncludeResultMessage } from './messages';
