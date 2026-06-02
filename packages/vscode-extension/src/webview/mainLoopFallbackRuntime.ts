import type {
	EditorConfig,
	EditorConfigSchemaContribution,
	EventDispatcher,
	RuntimeRegistryEntry,
	State,
} from '@8f4e/editor';
import { resolveSchemaConfigRoot } from '@8f4e/editor';
import type { StateManager } from '@8f4e/state-manager';

interface MainLoopFallbackRuntimeOptions {
	id: string;
	configRoot: string;
	defaultSampleRate: number;
	getCodeBuffer: () => Uint8Array;
	getMemory: () => WebAssembly.Memory | null;
}

export function createMainLoopFallbackRuntimeDef({
	id,
	configRoot,
	defaultSampleRate,
	getCodeBuffer,
	getMemory,
}: MainLoopFallbackRuntimeOptions): RuntimeRegistryEntry {
	const editorConfigSchema: EditorConfigSchemaContribution = {
		root: configRoot,
		defaults: {
			sampleRate: defaultSampleRate,
		},
		schema: {
			type: 'object',
			properties: {
				sampleRate: { type: 'number', minimum: 1 },
			},
			additionalProperties: false,
		},
	};

	const getSampleRate = (editorConfig: EditorConfig) => {
		const config = resolveSchemaConfigRoot(editorConfigSchema, editorConfig);
		return typeof config.sampleRate === 'number' ? config.sampleRate : defaultSampleRate;
	};

	return {
		id,
		editorConfigSchema,
		getEnvConstants: editorConfig => [`const SAMPLE_RATE ${getSampleRate(editorConfig)}`],
		factory: (store, events) =>
			mainLoopFallbackRuntimeFactory(store, events, getCodeBuffer, getMemory, getSampleRate, configRoot),
	};
}

function mainLoopFallbackRuntimeFactory(
	store: StateManager<State>,
	events: EventDispatcher,
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null,
	getSampleRate: (editorConfig: EditorConfig) => number,
	configRoot: string
) {
	const state = store.getState();
	let interval: ReturnType<typeof setInterval> | undefined;
	let statsInterval: ReturnType<typeof setInterval> | undefined;
	let syncToken = 0;
	let disposed = false;
	let timeToExecuteLoopMs = 0;
	let lastIntervalTime = 0;
	let timerDriftMs = 0;

	function stopTimers() {
		if (interval !== undefined) {
			clearInterval(interval);
			interval = undefined;
		}
		if (statsInterval !== undefined) {
			clearInterval(statsInterval);
			statsInterval = undefined;
		}
	}

	async function syncCodeAndSettingsWithRuntime() {
		const memory = getMemory();
		const codeBuffer = getCodeBuffer();

		stopTimers();
		const token = ++syncToken;

		if (!memory || codeBuffer.length === 0) {
			console.warn('[Runtime] Memory or code not yet created, skipping fallback runtime init');
			return;
		}

		try {
			const { instance } = (await WebAssembly.instantiate(codeBuffer, {
				host: {
					memory,
				},
			})) as unknown as { instance: WebAssembly.Instance };
			const main = instance.exports.main as CallableFunction | undefined;
			if (typeof main !== 'function') {
				throw new Error('Compiled project does not export a main entry.');
			}
			if (disposed || token !== syncToken) {
				return;
			}

			const intervalTime = Math.max(1, Math.floor(1000 / getSampleRate(state.editorConfig)));
			lastIntervalTime = performance.now();
			interval = setInterval(() => {
				const startTime = performance.now();
				timerDriftMs = startTime - lastIntervalTime - intervalTime;
				lastIntervalTime = startTime;
				main();
				timeToExecuteLoopMs = performance.now() - startTime;
			}, intervalTime);
			statsInterval = setInterval(() => {
				const runtimeInfo = state.info.runtime ?? (state.info.runtime = {});
				runtimeInfo.timerPrecisionPercentage = 100 - Math.abs(timerDriftMs / intervalTime) * 100;
				runtimeInfo.timeToExecuteLoopMs = timeToExecuteLoopMs;
				runtimeInfo.timerDriftMs = timerDriftMs;
				runtimeInfo.timerExpectedIntervalTimeMs = intervalTime;
			}, 10000);
			events.dispatch('runtimeInitialized');
		} catch (error) {
			console.error('Fallback runtime error:', error);
		}
	}

	void syncCodeAndSettingsWithRuntime();
	store.subscribeToValue('compiler.isCompiling', false, syncCodeAndSettingsWithRuntime);
	store.subscribe(`editorConfig.${configRoot}` as 'editorConfig', syncCodeAndSettingsWithRuntime);

	return () => {
		disposed = true;
		syncToken += 1;
		store.unsubscribe('compiler.isCompiling', syncCodeAndSettingsWithRuntime);
		store.unsubscribe(`editorConfig.${configRoot}` as 'editorConfig', syncCodeAndSettingsWithRuntime);
		stopTimers();
	};
}
