import compile, { CompiledModuleLookup, MemoryAddressLookup, MemoryBuffer, Module } from '@8f4e/compiler';

export default async function createModule(
	memoryRef: WebAssembly.Memory,
	modules: Module[]
): Promise<{
	memoryBuffer: MemoryBuffer;
	cycle: CallableFunction;
	init: CallableFunction;
	memoryAddressLookup: MemoryAddressLookup;
	compiledModules: CompiledModuleLookup;
}> {
	const { codeBuffer, memoryAddressLookup, compiledModules } = compile(modules);

	const memoryBuffer = new Int32Array(memoryRef.buffer);

	const { instance } = await WebAssembly.instantiate(codeBuffer, {
		js: {
			memory: memoryRef,
		},
	});

	const cycle = instance.exports.cycle as CallableFunction;
	const init = instance.exports.init as CallableFunction;

	return { memoryBuffer, cycle, init, memoryAddressLookup, compiledModules };
}
