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

export interface CompilerService {
	compileCode: (
		project: ProjectObjectModel,
		compilerOptions: CompileProjectOptions,
		editor: Editor
	) => Promise<CompilationResult>;
	getMemory: () => WebAssembly.Memory | null;
	getCodeBuffer: () => Uint8Array;
	dispose: () => void;
}

export function createCompilerService(createWorker: () => Worker = () => new CompilerWorker()): CompilerService {
	let compilerWorker: Worker | null = null;
	let memoryRef: WebAssembly.Memory | null = null;
	let codeBuffer: Uint8Array = new Uint8Array();
	let nextCompilationId = 0;
	let includeResolver: ProjectIncludeResolver | undefined;
	let disposed = false;
	const pendingCompilations = new Map<
		number,
		{
			handleMessage: (event: MessageEvent) => void;
			reject: (error: Error) => void;
		}
	>();

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
		compilerWorker?.postMessage(response);
	}

	function getCompilerWorker(): Worker {
		if (disposed) {
			throw new Error('Compiler service has been disposed');
		}

		if (!compilerWorker) {
			compilerWorker = createWorker();
			compilerWorker.addEventListener('message', handleIncludeRequest);
		}

		return compilerWorker;
	}

	return {
		async compileCode(project, compilerOptions, editor) {
			const { resolveInclude, ...serializableCompilerOptions } = compilerOptions;
			const worker = getCompilerWorker();
			includeResolver = resolveInclude;
			const compilationId = nextCompilationId++;

			return new Promise((resolve, reject) => {
				const handleMessage = ({ data }: MessageEvent) => {
					if (data.compilationId !== compilationId) return;
					switch (data.type) {
						case 'success':
							worker.removeEventListener('message', handleMessage);
							pendingCompilations.delete(compilationId);
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
							worker.removeEventListener('message', handleMessage);
							pendingCompilations.delete(compilationId);
							reject(data.payload as CompilerDiagnostic);
							break;
					}
				};

				pendingCompilations.set(compilationId, { handleMessage, reject });
				worker.addEventListener('message', handleMessage);

				worker.postMessage({
					type: 'compile',
					compilationId,
					payload: {
						project,
						compilerOptions: serializableCompilerOptions,
					},
				});
			});
		},
		getMemory: () => memoryRef,
		getCodeBuffer: () => codeBuffer,
		dispose: () => {
			if (disposed) {
				return;
			}

			disposed = true;
			const disposalError = new Error('Compiler service has been disposed');
			for (const { handleMessage, reject } of pendingCompilations.values()) {
				compilerWorker?.removeEventListener('message', handleMessage);
				reject(disposalError);
			}
			pendingCompilations.clear();
			compilerWorker?.removeEventListener('message', handleIncludeRequest);
			compilerWorker?.terminate();
			compilerWorker = null;
		},
	};
}
