const noop = () => {
	return;
};

export default async function createModule(
	memoryRef: WebAssembly.Memory,
	codeBuffer: Uint8Array
): Promise<{
	memoryBuffer: Float32Array;
	main: CallableFunction;
	initDefaults: CallableFunction;
	buffer: CallableFunction;
}> {
	const memoryBuffer = new Float32Array(memoryRef.buffer);

	const { instance } = (await WebAssembly.instantiate(codeBuffer, {
		host: {
			memory: memoryRef,
		},
	})) as unknown as { instance: WebAssembly.Instance; module: WebAssembly.Module };

	const main = instance.exports.main as CallableFunction;
	const buffer = typeof instance.exports.buffer === 'function' ? instance.exports.buffer : noop;
	const initDefaults = instance.exports.initDefaults as CallableFunction;

	return { memoryBuffer, main, buffer, initDefaults };
}
