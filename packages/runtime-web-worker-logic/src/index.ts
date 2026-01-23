// Export runtime metadata for hosts to import
export * from './metadata';

import createModule from './createModule';

let interval: ReturnType<typeof setInterval>;
let statsInterval: ReturnType<typeof setInterval>;
let timeToExecuteLoopMs: number;
let lastIntervalTime: number;
let timerDriftMs: number;

async function init(memoryRef: WebAssembly.Memory, sampleRate: number, codeBuffer: Uint8Array) {
	try {
		const wasmApp = await createModule(memoryRef, codeBuffer);

		const intervalTime = Math.floor(1000 / sampleRate);

		lastIntervalTime = performance.now();

		clearInterval(interval);

		interval = setInterval(() => {
			const startTime = performance.now();
			timerDriftMs = startTime - lastIntervalTime - intervalTime;
			lastIntervalTime = startTime;
			wasmApp.cycle();
			const endTime = performance.now();
			timeToExecuteLoopMs = endTime - startTime;
		}, intervalTime);

		clearInterval(statsInterval);

		statsInterval = setInterval(() => {
			self.postMessage({
				type: 'stats',
				payload: {
					timerPrecisionPercentage: 100 - Math.abs(timerDriftMs / intervalTime) * 100,
					timeToExecuteLoopMs,
					timerDriftMs,
					timerExpectedIntervalTimeMs: intervalTime,
				},
			});
		}, 10000);

		self.postMessage({
			type: 'initialized',
			payload: {},
		});
	} catch (error) {
		console.log('compilationError', error);
		self.postMessage({
			type: 'compilationError',
			payload: error,
		});
	}
}

self.onmessage = function (event) {
	switch (event.data.type) {
		case 'init':
			init(event.data.payload.memoryRef, event.data.payload.sampleRate, event.data.payload.codeBuffer);
			break;
	}
};
