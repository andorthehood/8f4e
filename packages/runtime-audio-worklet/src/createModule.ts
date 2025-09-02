export default async function createModule(
	memoryRef: WebAssembly.Memory,
	codeBuffer: Uint8Array
): Promise<{
	memoryBuffer: Float32Array;
	cycle: CallableFunction;
	init: CallableFunction;
	buffer: CallableFunction;
}> {
	const memoryBuffer = new Float32Array(memoryRef.buffer);

	const instance = await WebAssembly.instantiate(codeBuffer, {
		js: {
			memory: memoryRef,
		},
	});

	const cycle = instance.exports.cycle as CallableFunction;
	const buffer = instance.exports.buffer as CallableFunction;
	const init = instance.exports.init as CallableFunction;

	return { memoryBuffer, cycle, buffer, init };
}
