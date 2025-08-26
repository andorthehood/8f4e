import Worker from '@8f4e/compiler-worker?worker';

import type { Project, CompilationResult } from '@8f4e/editor';
import type { CompileOptions, Module } from '@8f4e/compiler';

// Global worker instance to maintain state across compilations
let worker: Worker | null = null;

/**
 * Initialize the compiler worker if not already created
 */
function getWorker(): Worker {
	if (!worker) {
		worker = new Worker();
	}
	return worker;
}

/**
 * Implementation of the compile callback that uses the existing compiler worker.
 * This function receives project data and delegates to the compiler worker, then
 * returns compiled modules, code buffer, and memory information.
 */
export async function compileProject(project: Project, options: CompileOptions): Promise<CompilationResult> {
	// Convert project code blocks to modules format expected by compiler worker
	const modules: Module[] = project.codeBlocks.map(codeBlock => ({
		code: codeBlock.code,
	}));

	// Create WebAssembly memory instance
	const memoryRef = new WebAssembly.Memory({
		initial: options.initialMemorySize,
		maximum: options.maxMemorySize,
		shared: true,
	});

	const compilerWorker = getWorker();

	// Return a Promise that resolves when the worker responds
	return new Promise<CompilationResult>((resolve, reject) => {
		// Set up one-time message listener for this compilation
		function onWorkerMessage({ data }: MessageEvent) {
			compilerWorker.removeEventListener('message', onWorkerMessage);

			switch (data.type) {
				case 'buildOk':
					resolve({
						compiledModules: data.payload.compiledModules,
						codeBuffer: data.payload.codeBuffer,
						allocatedMemorySize: data.payload.allocatedMemorySize,
						memoryRef,
						buildErrors: [], // Always empty array on success
					});
					break;
				case 'buildError':
					// Reject with the error so the editor can catch it and convert to BuildError format
					reject(data.payload);
					break;
				default:
					reject(new Error(`Unknown message type from compiler worker: ${data.type}`));
			}
		}

		compilerWorker.addEventListener('message', onWorkerMessage);

		// Send compilation request to worker
		compilerWorker.postMessage({
			type: 'recompile',
			payload: {
				memoryRef,
				modules,
				compilerOptions: options,
			},
		});
	});
}
