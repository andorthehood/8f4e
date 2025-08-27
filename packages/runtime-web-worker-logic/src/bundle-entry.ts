// Bundle entry point for logic runtime worker - exposes worker code as string

// This will be bundled by Vite and all dependencies will be included
// We create the worker code as a string that can be used with blob URLs

const createModule = `
async function createModule(memoryRef, codeBuffer) {
	const memoryBuffer = new Int32Array(memoryRef.buffer);

	const { instance } = await WebAssembly.instantiate(codeBuffer, {
		js: {
			memory: memoryRef,
		},
	});

	const cycle = instance.exports.cycle;
	const buffer = instance.exports.buffer;
	const init = instance.exports.init;

	return { memoryBuffer, cycle, buffer, init };
}
`;

// The complete worker code as a string
export const workerCode = `
${createModule}

let interval;
let statsInterval;
let timeToExecute;
let lastIntervalTime;
let drift = 0;

async function init(memoryRef, sampleRate, codeBuffer) {
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
`.trim();

// Export as default for UMD access
export default { workerCode };
