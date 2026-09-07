const noop = () => {
	return;
};

export default async function createModule(
	memoryRef: WebAssembly.Memory,
	codeBuffer: Uint8Array,
	entryName = 'buffer'
): Promise<{
	memoryBuffer: Float32Array;
	entry: CallableFunction;
	initDefaults: CallableFunction;
}> {
	const memoryBuffer = new Float32Array(memoryRef.buffer);

	const { instance } = (await WebAssembly.instantiate(codeBuffer, {
		host: {
			memory: memoryRef,
		},
	})) as unknown as { instance: WebAssembly.Instance; module: WebAssembly.Module };

	const exportedEntry = instance.exports[entryName];
	const entry = typeof exportedEntry === 'function' ? exportedEntry : noop;
	const initDefaults = instance.exports.initDefaults as CallableFunction;

	return { memoryBuffer, entry, initDefaults };
}
