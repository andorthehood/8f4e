// Bundle entry point for logic runtime worker - exposes functions globally
import createModule from './createModule';

export async function init(memoryRef: WebAssembly.Memory, sampleRate: number, codeBuffer: Uint8Array) {
	const wasmApp = await createModule(memoryRef, codeBuffer);
	
	return {
		wasmApp,
		sampleRate,
		intervalTime: Math.floor(1000 / sampleRate),
	};
}

export function createLogicRuntime(memoryRef: WebAssembly.Memory, sampleRate: number, codeBuffer: Uint8Array) {
	let interval: number | undefined;
	let statsInterval: number | undefined;
	let timeToExecute: number;
	let lastIntervalTime: number;
	let drift = 0;
	let wasmApp: any;

	const runtime = {
		async initialize() {
			try {
				if (interval !== undefined) clearInterval(interval);
				if (statsInterval !== undefined) clearInterval(statsInterval);

				wasmApp = await createModule(memoryRef, codeBuffer);

				const intervalTime = Math.floor(1000 / sampleRate);

				interval = setInterval(() => {
					const startTime = performance.now();
					drift += intervalTime - (startTime - lastIntervalTime);
					lastIntervalTime = startTime;
					wasmApp.cycle();
					const endTime = performance.now();
					timeToExecute = endTime - startTime;
				}, intervalTime);

				return { success: true };
			} catch (error) {
				console.log('buildError', error);
				return { success: false, error };
			}
		},

		getStats() {
			return {
				drift,
				timeToExecute,
			};
		},

		stop() {
			if (interval !== undefined) clearInterval(interval);
			if (statsInterval !== undefined) clearInterval(statsInterval);
		}
	};

	return runtime;
}
