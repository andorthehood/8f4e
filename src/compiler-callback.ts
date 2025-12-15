import { type Module, type CompileOptions } from '@8f4e/compiler';
import { type CompilationResult } from '@8f4e/editor';
import CompilerWorker from '@8f4e/compiler-worker?worker';

// Create worker once at module scope
// it will live for the entire application lifecycle
const compilerWorker = new CompilerWorker();

let memoryRef: WebAssembly.Memory | null = null;

export async function compileProject(
	modules: Module[],
	compilerOptions: CompileOptions,
	functions?: Module[]
): Promise<CompilationResult> {
	return new Promise((resolve, reject) => {
		const handleMessage = ({ data }: MessageEvent) => {
			switch (data.type) {
				case 'success':
					memoryRef = data.payload.wasmMemory;
					resolve({
						compiledModules: data.payload.compiledModules,
						codeBuffer: data.payload.codeBuffer,
						allocatedMemorySize: data.payload.allocatedMemorySize,
						memoryBuffer: new Int32Array(data.payload.wasmMemory.buffer),
						memoryBufferFloat: new Float32Array(data.payload.wasmMemory.buffer),
						hasMemoryBeenInitialized: data.payload.hasMemoryBeenInitialized,
						hasMemoryBeenReset: data.payload.hasMemoryBeenReset,
						hasWasmInstanceBeenReset: data.payload.hasWasmInstanceBeenReset,
						memoryAction: data.payload.memoryAction,
						compiledFunctions: data.payload.compiledFunctions,
					});
					break;
				case 'compilationError': {
					const error = new Error(data.payload.message) as Error & {
						line?: { lineNumber: number };
						context?: { namespace?: { moduleName: string } };
						errorCode?: number;
					};
					error.line = data.payload?.line;
					error.context = data.payload?.context;
					error.errorCode = data.payload?.errorCode;
					reject(error);
					break;
				}
			}
		};

		compilerWorker.addEventListener('message', handleMessage, { once: true });

		compilerWorker.postMessage({
			type: 'compile',
			payload: {
				modules,
				compilerOptions,
				functions,
			},
		});
	});
}

// Export memory getter for runtimes to access
export function getMemory(): WebAssembly.Memory | null {
	return memoryRef;
}
