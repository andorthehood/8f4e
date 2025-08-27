import type { RuntimeFactory, RuntimeType } from '@8f4e/editor';

/**
 * Gets a runtime factory using dynamic imports for lazy loading.
 * This allows runtime modules to be loaded only when actually needed.
 */
async function getRuntimeFactory(runtimeType: RuntimeType): Promise<RuntimeFactory> {
	switch (runtimeType) {
		case 'AudioWorkletRuntime': {
			const { audioWorkletRuntime } = await import('./audio-worklet-runtime-factory');
			return audioWorkletRuntime;
		}
		case 'WebWorkerLogicRuntime': {
			const { webWorkerLogicRuntime } = await import('./web-worker-logic-runtime-factory');
			return webWorkerLogicRuntime;
		}
		case 'WebWorkerMIDIRuntime': {
			const { webWorkerMIDIRuntime } = await import('./web-worker-midi-runtime-factory');
			return webWorkerMIDIRuntime;
		}
		default: {
			// Use const assertion to ensure exhaustive checking
			const exhaustiveCheck: never = runtimeType;
			throw new Error(`Unknown runtime type: ${exhaustiveCheck}`);
		}
	}
}

/**
 * Requests a runtime factory with proper error handling and logging.
 * This function maintains the same API as the previous static implementation.
 */
export async function requestRuntime(runtimeType: RuntimeType): Promise<RuntimeFactory> {
	try {
		console.log(`[App] Loading runtime factory for: ${runtimeType}`);
		const factory = await getRuntimeFactory(runtimeType);
		console.log(`[App] Successfully loaded runtime factory for: ${runtimeType}`);
		return factory;
	} catch (error) {
		console.error(`[App] Failed to load runtime factory for: ${runtimeType}`, error);
		throw new Error(
			`Failed to load runtime ${runtimeType}: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}
