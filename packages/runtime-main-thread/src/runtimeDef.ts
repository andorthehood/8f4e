// Import the types from the editor
import createMainThreadRuntime from '@8f4e/runtime-main-thread';
import { StateManager } from '@8f4e/state-manager';
import { resolveSchemaConfigRoot } from '@8f4e/editor';

import type {
	EditorConfig,
	EditorConfigSchemaContribution,
	EventDispatcher,
	RuntimeRegistryEntry,
	State,
} from '@8f4e/editor';

const MAIN_THREAD_EDITOR_CONFIG: EditorConfigSchemaContribution = {
	root: 'mainThreadRuntime',
	defaults: {
		sampleRate: 50,
	},
	schema: {
		type: 'object',
		properties: {
			sampleRate: { type: 'number', minimum: 1 },
		},
		additionalProperties: false,
	},
};

function getSampleRate(editorConfig: EditorConfig): number {
	const config = resolveSchemaConfigRoot(MAIN_THREAD_EDITOR_CONFIG, editorConfig);

	return typeof config.sampleRate === 'number' ? config.sampleRate : 50;
}

// Main Thread Runtime Factory
export function mainThreadRuntimeFactory(
	store: StateManager<State>,
	events: EventDispatcher,
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null
) {
	const state = store.getState();
	let runtime: ReturnType<typeof createMainThreadRuntime> | undefined;

	function onInitialized() {
		events.dispatch('runtimeInitialized');
	}

	function onStats(stats: {
		timerPrecisionPercentage: number;
		timeToExecuteLoopMs: number;
		timerDriftMs: number;
		timerExpectedIntervalTimeMs: number;
	}) {
		const runtimeInfo = state.info.runtime ?? (state.info.runtime = {});
		runtimeInfo.timerPrecisionPercentage = stats.timerPrecisionPercentage;
		runtimeInfo.timeToExecuteLoopMs = stats.timeToExecuteLoopMs;
		runtimeInfo.timerDriftMs = stats.timerDriftMs;
		runtimeInfo.timerExpectedIntervalTimeMs = stats.timerExpectedIntervalTimeMs;
	}

	function onError(error: unknown) {
		console.error('Main thread runtime error:', error);
	}

	function syncCodeAndSettingsWithRuntime() {
		if (!runtime) {
			return;
		}
		const memory = getMemory();
		if (!memory) {
			console.warn('[Runtime] Memory not yet created, skipping runtime init');
			return;
		}
		runtime.init(memory, getSampleRate(state.editorConfig), getCodeBuffer());
	}

	runtime = createMainThreadRuntime(onInitialized, onStats, onError);
	syncCodeAndSettingsWithRuntime();

	store.subscribeToValue('compiler.isCompiling', false, syncCodeAndSettingsWithRuntime);
	store.subscribe('editorConfig.mainThreadRuntime', syncCodeAndSettingsWithRuntime);

	return () => {
		store.unsubscribe('compiler.isCompiling', syncCodeAndSettingsWithRuntime);
		store.unsubscribe('editorConfig.mainThreadRuntime', syncCodeAndSettingsWithRuntime);
		if (runtime) {
			runtime.stop();
			runtime = undefined;
		}
	};
}

/**
 * Create a runtime definition with injected callbacks.
 * This allows the host to provide getCodeBuffer and getMemory implementations.
 */
export function createMainThreadRuntimeDef(
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null
): RuntimeRegistryEntry {
	return {
		id: 'MainThreadRuntime',
		editorConfigSchema: MAIN_THREAD_EDITOR_CONFIG,
		getEnvConstants: editorConfig => [`const SAMPLE_RATE ${getSampleRate(editorConfig)}`],
		factory: (store: StateManager<State>, events: EventDispatcher) => {
			return mainThreadRuntimeFactory(store, events, getCodeBuffer, getMemory);
		},
	};
}
