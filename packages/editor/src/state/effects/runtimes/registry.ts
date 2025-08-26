import { EventDispatcher } from '../../../events';
import { State, WebWorkerLogicRuntime, AudioWorkletRuntime, WebWorkerMIDIRuntime } from '../../types';

// Type for runtime factory function
export type RuntimeFactory = (state: State, events: EventDispatcher) => () => void;

// Type for runtime loader function
export type RuntimeLoader = () => Promise<{ default: RuntimeFactory }>;

// Runtime type union
export type RuntimeType =
	| WebWorkerLogicRuntime['runtime']
	| AudioWorkletRuntime['runtime']
	| WebWorkerMIDIRuntime['runtime'];

// Runtime metadata interface
export interface RuntimeMetadata {
	name: string;
	description: string;
	loader: RuntimeLoader;
}

// Runtime registry mapping runtime types to their metadata
export const runtimeRegistry: Record<RuntimeType, RuntimeMetadata> = {
	AudioWorkletRuntime: {
		name: 'Audio Worklet Runtime',
		description: 'Real-time audio processing using AudioWorklet API',
		loader: () => import('./audioWorkletRuntime'),
	},
	WebWorkerMIDIRuntime: {
		name: 'Web Worker MIDI Runtime',
		description: 'MIDI processing using Web Workers',
		loader: () => import('./webWorkerMIDIRuntime'),
	},
	WebWorkerLogicRuntime: {
		name: 'Web Worker Logic Runtime',
		description: 'General purpose logic processing using Web Workers',
		loader: () => import('./webWorkerLogicRuntime'),
	},
};

/**
 * Loads a runtime factory function using dynamic imports
 * @param runtimeType The type of runtime to load
 * @returns Promise that resolves to the runtime factory function
 */
export async function loadRuntime(runtimeType: RuntimeType): Promise<RuntimeFactory> {
	// Get metadata for the runtime
	const metadata = runtimeRegistry[runtimeType];
	if (!metadata) {
		throw new Error(`Unknown runtime type: ${runtimeType}`);
	}

	try {
		// Dynamically import the runtime module
		const module = await metadata.loader();
		const factory = module.default;

		// Validate that we got a function
		if (typeof factory !== 'function') {
			throw new Error(`Runtime ${runtimeType} does not export a valid factory function`);
		}

		return factory;
	} catch (error) {
		throw new Error(
			`Failed to load runtime ${runtimeType}: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Gets all available runtime types
 */
export function getAvailableRuntimes(): RuntimeType[] {
	return Object.keys(runtimeRegistry) as RuntimeType[];
}

/**
 * Gets metadata for a specific runtime
 */
export function getRuntimeMetadata(runtimeType: RuntimeType): RuntimeMetadata | undefined {
	return runtimeRegistry[runtimeType];
}
