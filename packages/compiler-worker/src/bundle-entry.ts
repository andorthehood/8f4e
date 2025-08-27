// Bundle entry point for compiler worker - provides factory functions for external use
import { CompileOptions, Module } from '@8f4e/compiler';

// Re-export the testBuild function for direct use
export { default as testBuild } from './testBuild';

/**
 * Creates a new compiler worker from the bundled code
 * This can be used in external websites to create worker instances
 */
export function createCompilerWorker(): Worker {
	// Create a blob URL from the current script for worker instantiation
	const workerCode = `
    // Import the bundled compiler worker code
    importScripts('${getScriptURL()}');
  `;

	const blob = new Blob([workerCode], { type: 'application/javascript' });
	const workerURL = URL.createObjectURL(blob);
	return new Worker(workerURL);
}

/**
 * Get the URL of the current script (this bundle)
 */
function getScriptURL(): string {
	const scripts = document.getElementsByTagName('script');
	for (let i = scripts.length - 1; i >= 0; i--) {
		const src = scripts[i].src;
		if (src && src.includes('8f4e-compiler-worker')) {
			return src;
		}
	}
	// Fallback - might need to be set manually
	return './8f4e-compiler-worker.js';
}

/**
 * Direct compilation interface for use in main thread
 * Note: This bypasses the worker and runs in main thread
 */
export async function compileModules(
	memoryRef: WebAssembly.Memory,
	modules: Module[],
	compilerOptions: CompileOptions
) {
	const testBuild = await import('./testBuild');
	return testBuild.default(memoryRef, modules, compilerOptions);
}

// Default export provides the main factory function
export default {
	createCompilerWorker,
	compileModules,
	testBuild: async (memoryRef: WebAssembly.Memory, modules: Module[], compilerOptions: CompileOptions) => {
		const testBuild = await import('./testBuild');
		return testBuild.default(memoryRef, modules, compilerOptions);
	},
};
