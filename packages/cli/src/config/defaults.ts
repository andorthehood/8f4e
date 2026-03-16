export const DEFAULT_RUNTIME_ID = 'WebWorkerLogicRuntime';

export const RUNTIME_DEFAULTS: Record<string, Record<string, unknown>> = {
	WebWorkerLogicRuntime: {
		runtime: 'WebWorkerLogicRuntime',
		sampleRate: 50,
	},
	MainThreadLogicRuntime: {
		runtime: 'MainThreadLogicRuntime',
		sampleRate: 50,
	},
	AudioWorkletRuntime: {
		runtime: 'AudioWorkletRuntime',
		sampleRate: 44100,
	},
	WebWorkerMIDIRuntime: {
		runtime: 'WebWorkerMIDIRuntime',
		sampleRate: 50,
	},
};

export function createDefaultProjectConfig(runtimeId = DEFAULT_RUNTIME_ID): Record<string, unknown> {
	return {
		runtimeSettings: { ...(RUNTIME_DEFAULTS[runtimeId] ?? RUNTIME_DEFAULTS[DEFAULT_RUNTIME_ID]) },
		disableAutoCompilation: false,
	};
}

const DEFAULT_PROJECT_CONFIG = createDefaultProjectConfig();

export default DEFAULT_PROJECT_CONFIG;
