import createModule from './createModule';

let interval: ReturnType<typeof setInterval>;
let statsInterval: ReturnType<typeof setInterval>;
let timeToExecute: number;
let lastIntervalTime: number;
let drift = 0;

async function init(memoryRef: WebAssembly.Memory, sampleRate: number, codeBuffer: Uint8Array) {
	try {
		clearInterval(interval);
		clearInterval(statsInterval);

		const wasmApp = await createModule(memoryRef, codeBuffer);

		const intervalTime = Math.floor(1000 / sampleRate);

		interval = setInterval(() => {
			const startTime = performance.now();
			drift += intervalTime - (startTime - lastIntervalTime);
			lastIntervalTime = startTime;
			wasmApp.cycle();
			const endTime = performance.now();
			timeToExecute = endTime - startTime;
		}, intervalTime);

		statsInterval = setInterval(() => {
			self.postMessage({
				type: 'stats',
				payload: {
					drift,
					timeToExecute,
				},
			});
		}, 10000);

		self.postMessage({
			type: 'initialized',
			payload: {},
		});
	} catch (error) {
		console.log('buildError', error);
		self.postMessage({
			type: 'buildError',
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
