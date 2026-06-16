import CompilerWorker from '@8f4e/compiler-worker?worker';
import type { CompilationResult, Editor } from '@8f4e/editor';
import type { CompileInput, CompileOptions, CompilerDiagnostic } from '@8f4e/language-spec';

// Create worker once at module scope
// it will live for the entire application lifecycle
const compilerWorker = new CompilerWorker();

let memoryRef: WebAssembly.Memory | null = null;
let codeBuffer: Uint8Array = new Uint8Array();

export async function compileCode(
	input: CompileInput,
	compilerOptions: CompileOptions,
	editor: Editor
): Promise<CompilationResult> {
	return new Promise((resolve, reject) => {
		const handleMessage = ({ data }: MessageEvent) => {
			switch (data.type) {
				case 'success':
					memoryRef = data.payload.wasmMemory;
					codeBuffer = data.payload.codeBuffer;

					editor.updateMemoryViews(data.payload.wasmMemory);

					resolve({
						compiledModules: data.payload.compiledModules,
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
					reject(data.payload as CompilerDiagnostic);
					break;
			}
		};

		compilerWorker.addEventListener('message', handleMessage, { once: true });

		console.log(
			'[Compiler] Functions sent to compiler:',
			input.functions.map((func, index) => ({
				index,
				projectBlockId: func.projectBlockId,
				firstLine: func.code[0],
			})),
			input.functions
		);

		compilerWorker.postMessage({
			type: 'compile',
			payload: {
				input,
				compilerOptions,
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
