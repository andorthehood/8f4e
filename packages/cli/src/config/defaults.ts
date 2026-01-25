const DEFAULT_PROJECT_CONFIG: Record<string, unknown> = {
	runtimeSettings: {
		runtime: 'WebWorkerLogicRuntime',
		sampleRate: 50,
	},
	memorySizeBytes: 1048576,
	disableAutoCompilation: false,
	binaryAssets: [],
};

export default DEFAULT_PROJECT_CONFIG;
