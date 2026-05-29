export default async function createModule(
	memoryRef: WebAssembly.Memory,
	codeBuffer: Uint8Array
): Promise<{
	memoryBuffer: Int32Array;
	cycle: CallableFunction;
	initDefaults: CallableFunction;
	buffer: CallableFunction;
}> {
	const memoryBuffer = new Int32Array(memoryRef.buffer);

	const { instance } = (await WebAssembly.instantiate(codeBuffer, {
		js: {
			memory: memoryRef,
		},
	})) as unknown as { instance: WebAssembly.Instance; module: WebAssembly.Module };

	const cycle = instance.exports.cycle as CallableFunction;
	const buffer = instance.exports.buffer as CallableFunction;
	const initDefaults = instance.exports.initDefaults as CallableFunction;

	return { memoryBuffer, cycle, buffer, initDefaults };
}
