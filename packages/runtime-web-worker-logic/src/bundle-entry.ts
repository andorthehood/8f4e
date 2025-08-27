// Bundle entry point for logic runtime worker - provides factory functions for external use

// Re-export the createModule function for direct use
export { default as createModule } from './createModule';

/**
 * Creates a new logic runtime worker from the bundled code
 * This can be used in external websites to create worker instances
 */
export function createLogicRuntimeWorker(): Worker {
	// Create a blob URL from the current script for worker instantiation
	const workerCode = `
    // Import the bundled logic runtime worker code
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
		if (src && src.includes('8f4e-logic-runtime')) {
			return src;
		}
	}
	// Fallback - might need to be set manually
	return './8f4e-logic-runtime.js';
}

/**
 * Direct logic runtime interface for use in main thread
 * Note: This bypasses the worker and runs in main thread - use with caution
 */
export async function runLogicRuntime(
	memoryRef: WebAssembly.Memory,
	sampleRate: number,
	codeBuffer: Uint8Array,
	callback?: (message: { type: string; payload: unknown }) => void
) {
	const createModule = await import('./createModule');

	try {
		const wasmApp = await createModule.default(memoryRef, codeBuffer);
		const intervalTime = Math.floor(1000 / sampleRate);

		let drift = 0;
		let timeToExecute = 0;
		let lastIntervalTime = performance.now();

		const interval = setInterval(() => {
			const startTime = performance.now();
			drift += intervalTime - (startTime - lastIntervalTime);
			lastIntervalTime = startTime;
			wasmApp.cycle();
			const endTime = performance.now();
			timeToExecute = endTime - startTime;
		}, intervalTime);

		const statsInterval = setInterval(() => {
			if (callback) {
				callback({
					type: 'stats',
					payload: {
						drift,
						timeToExecute,
					},
				});
			}
		}, 10000);

		if (callback) {
			callback({
				type: 'initialized',
				payload: {},
			});
		}

		return {
			stop: () => {
				clearInterval(interval);
				clearInterval(statsInterval);
			},
			wasmApp,
		};
	} catch (error) {
		console.log('buildError', error);
		if (callback) {
			callback({
				type: 'buildError',
				payload: error,
			});
		}
		throw error;
	}
}

// Default export provides the main factory function
export default {
	createLogicRuntimeWorker,
	runLogicRuntime,
	createModule: async (memoryRef: WebAssembly.Memory, codeBuffer: Uint8Array) => {
		const createModule = await import('./createModule');
		return createModule.default(memoryRef, codeBuffer);
	},
};
