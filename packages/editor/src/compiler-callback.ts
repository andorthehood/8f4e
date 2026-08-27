import { serializeDiagnostic } from '@8f4e/compiler';
import type { ResolveIncludeRequestMessage, ResolveIncludeResultMessage } from '@8f4e/compiler-worker';
import CompilerWorker from '@8f4e/compiler-worker?worker';
import type { CompilationResult, Editor } from '@8f4e/editor-core';
import type {
	CompileProjectOptions,
	CompilerDiagnostic,
	ProjectIncludeResolver,
	ProjectObjectModel,
} from '@8f4e/language-spec';

// Create worker once at module scope
// it will live for the entire application lifecycle
const compilerWorker = new CompilerWorker();

let memoryRef: WebAssembly.Memory | null = null;
let codeBuffer: Uint8Array = new Uint8Array();
let nextCompilationId = 0;
let includeResolver: ProjectIncludeResolver | undefined;

async function handleIncludeRequest({ data }: MessageEvent): Promise<void> {
	if (data.type !== 'resolveInclude') return;
	const request = data as ResolveIncludeRequestMessage;
	let response: ResolveIncludeResultMessage;
	try {
		response = {
			type: 'resolveIncludeResult',
			payload: {
				requestId: request.payload.requestId,
				source: await includeResolver?.(request.payload.includeId),
			},
		};
	} catch (error) {
		response = {
			type: 'resolveIncludeResult',
			payload: {
				requestId: request.payload.requestId,
				error: serializeDiagnostic(error),
			},
		};
	}
	compilerWorker.postMessage(response);
}

compilerWorker.addEventListener('message', handleIncludeRequest);

export async function compileCode(
	project: ProjectObjectModel,
	compilerOptions: CompileProjectOptions,
	editor: Editor
): Promise<CompilationResult> {
	const { resolveInclude, ...serializableCompilerOptions } = compilerOptions;
	includeResolver = resolveInclude;
	const compilationId = nextCompilationId++;

	return new Promise((resolve, reject) => {
		const handleMessage = async ({ data }: MessageEvent) => {
			if (data.compilationId !== compilationId) return;
			switch (data.type) {
				case 'success':
					compilerWorker.removeEventListener('message', handleMessage);
					memoryRef = data.payload.wasmMemory;
					codeBuffer = data.payload.codeBuffer;

					editor.updateMemoryViews(data.payload.wasmMemory);

					resolve({
						compiledModules: data.payload.compiledModules,
						memoryPlan: data.payload.memoryPlan,
						memoryDefaultsByModuleId: data.payload.memoryDefaultsByModuleId,
						pointerMetadataByModuleId: data.payload.pointerMetadataByModuleId,
						projectMemoryExposuresByGroupPath: data.payload.projectMemoryExposuresByGroupPath,
						codeBuffer: data.payload.codeBuffer,
						requiredMemoryBytes: data.payload.requiredMemoryBytes,
						allocatedMemoryBytes: data.payload.allocatedMemoryBytes,
						astCacheStats: data.payload.astCacheStats,
						hasWasmInstanceBeenReset: data.payload.hasWasmInstanceBeenReset,
						memoryAction: data.payload.memoryAction,
						compiledFunctions: data.payload.compiledFunctions,
						byteCodeSize: data.payload.codeBuffer.length,
						initOnlyReran: data.payload.initOnlyReran,
					});
					break;
				case 'compilationError':
					compilerWorker.removeEventListener('message', handleMessage);
					reject(data.payload as CompilerDiagnostic);
					break;
			}
		};

		compilerWorker.addEventListener('message', handleMessage);

		compilerWorker.postMessage({
			type: 'compile',
			compilationId,
			payload: {
				project,
				compilerOptions: serializableCompilerOptions,
			},
		});
	});
}

// Export memory getter for runtimes to access
export function getMemory(): WebAssembly.Memory | null {
	return memoryRef;
}

export function getCodeBuffer(): Uint8Array {
	return codeBuffer;
}
