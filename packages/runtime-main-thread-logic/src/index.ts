import createModule from './createModule';

export interface MainThreadLogicRuntime {
	init: (memoryRef: WebAssembly.Memory, sampleRate: number, codeBuffer: Uint8Array) => Promise<void>;
	start: () => void;
	stop: () => void;
	getStats: () => { drift: number; timeToExecute: number };
	isRunning: () => boolean;
}

export default function createMainThreadLogicRuntime(
	onInitialized: () => void,
	onStats: (stats: { drift: number; timeToExecute: number }) => void,
	onError: (error: unknown) => void
): MainThreadLogicRuntime {
	let interval: ReturnType<typeof setInterval> | undefined;
	let statsInterval: ReturnType<typeof setInterval> | undefined;
	let timeToExecute = 0;
	let lastIntervalTime = 0;
	let drift = 0;
	let wasmApp: { cycle: CallableFunction } | null = null;
	let isRunning = false;

	async function init(memoryRef: WebAssembly.Memory, sampleRate: number, codeBuffer: Uint8Array) {
		try {
			// Stop any existing runtime
			stop();

			wasmApp = await createModule(memoryRef, codeBuffer);

			const intervalTime = Math.floor(1000 / sampleRate);

			interval = setInterval(() => {
				if (!wasmApp) return;

				const startTime = performance.now();
				drift += intervalTime - (startTime - lastIntervalTime);
				lastIntervalTime = startTime;
				wasmApp.cycle();
				const endTime = performance.now();
				timeToExecute = endTime - startTime;
			}, intervalTime);

			statsInterval = setInterval(() => {
				onStats({
					drift,
					timeToExecute,
				});
			}, 10000);

			isRunning = true;
			onInitialized();
		} catch (error) {
			console.log('compilationError', error);
			onError(error);
		}
	}

	function start() {
		// For this runtime, start is handled in init
		// This method exists for API compatibility
	}

	function stop() {
		if (interval !== undefined) {
			clearInterval(interval);
			interval = undefined;
		}
		if (statsInterval !== undefined) {
			clearInterval(statsInterval);
			statsInterval = undefined;
		}
		wasmApp = null;
		isRunning = false;
	}

	function getStats() {
		return {
			drift,
			timeToExecute,
		};
	}

	function getIsRunning() {
		return isRunning;
	}

	return {
		init,
		start,
		stop,
		getStats,
		isRunning: getIsRunning,
	};
}
