import { type Module, type CompileOptions } from '@8f4e/compiler';
import { type CompilationResult } from '@8f4e/editor';
import CompilerWorker from '@8f4e/compiler-worker?worker';

// Create worker once at module scope
// it will live for the entire application lifecycle
const compilerWorker = new CompilerWorker();

// Create WebAssembly memory for compilation
// This memory is shared with the compiler worker and runtimes
let memoryRef: WebAssembly.Memory | null = null;
let currentMemorySize = 0;

export function getOrCreateMemory(memorySizeBytes: number): WebAssembly.Memory {
	const WASM_PAGE_SIZE = 65536; // 64KiB per page
	const pages = Math.ceil(memorySizeBytes / WASM_PAGE_SIZE);

	// Create new memory only if it doesn't exist or if we need more space
	// We keep existing memory if it's large enough to avoid unnecessary recreations
	if (!memoryRef || currentMemorySize < memorySizeBytes) {
		memoryRef = new WebAssembly.Memory({
			initial: pages,
			maximum: pages,
			shared: true,
		});
		currentMemorySize = memorySizeBytes;
	}

	return memoryRef;
}

export async function compileProject(modules: Module[], compilerOptions: CompileOptions): Promise<CompilationResult> {
	// Create or reuse memory
	const memory = getOrCreateMemory(compilerOptions.memorySizeBytes);

	return new Promise((resolve, reject) => {
		const handleMessage = ({ data }: MessageEvent) => {
			switch (data.type) {
				case 'buildOk':
					resolve({
						compiledModules: data.payload.compiledModules,
						codeBuffer: data.payload.codeBuffer,
						allocatedMemorySize: data.payload.allocatedMemorySize,
						memoryBuffer: new Int32Array(memory.buffer),
						memoryBufferFloat: new Float32Array(memory.buffer),
					});
					break;
				case 'buildError': {
					// Create an error object that matches the expected structure
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

		// Add listener for this compilation
		compilerWorker.addEventListener('message', handleMessage, { once: true });

		compilerWorker.postMessage({
			type: 'recompile',
			payload: {
				memoryRef: memory,
				modules,
				compilerOptions,
			},
		});
	});
}

// Export memory getter for runtimes to access
export function getMemory(): WebAssembly.Memory | null {
	return memoryRef;
}
