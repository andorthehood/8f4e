import { type Module, type CompileOptions } from '@8f4e/compiler';
import { type CompilationResult, type MemoryRef } from '@8f4e/editor';
import CompilerWorker from '@8f4e/compiler-worker?worker';

// Create worker once at module scope
// it will live for the entire application lifecycle
const compilerWorker = new CompilerWorker();

export async function compileProject(
	modules: Module[],
	compilerOptions: CompileOptions,
	memoryRef: MemoryRef
): Promise<CompilationResult> {
	return new Promise((resolve, reject) => {
		const handleMessage = ({ data }: MessageEvent) => {
			switch (data.type) {
				case 'buildOk':
					resolve({
						compiledModules: data.payload.compiledModules,
						codeBuffer: data.payload.codeBuffer,
						allocatedMemorySize: data.payload.allocatedMemorySize,
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
				memoryRef,
				modules,
				compilerOptions,
			},
		});
	});
}
