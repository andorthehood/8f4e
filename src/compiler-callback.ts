import { type Module, type CompileOptions } from '@8f4e/compiler';
import { type CompilationResult } from '@8f4e/editor';
import CompilerWorker from '@8f4e/compiler-worker?worker';

// Implementation of the compileProject callback using the existing compiler-worker
export async function compileProject(
	modules: Module[],
	compilerOptions: CompileOptions,
	memoryRef: WebAssembly.Memory
): Promise<CompilationResult> {
	return new Promise((resolve, reject) => {
		const worker = new CompilerWorker();

		const handleMessage = ({ data }: MessageEvent) => {
			switch (data.type) {
				case 'buildOk':
					worker.terminate();
					resolve({
						compiledModules: data.payload.compiledModules,
						codeBuffer: data.payload.codeBuffer,
						allocatedMemorySize: data.payload.allocatedMemorySize,
					});
					break;
				case 'buildError': {
					worker.terminate();
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

		worker.addEventListener('message', handleMessage);
		worker.postMessage({
			type: 'recompile',
			payload: {
				memoryRef,
				modules,
				compilerOptions,
			},
		});
	});
}
