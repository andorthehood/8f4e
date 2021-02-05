export const setInitialMemory = function (memory: any, initialMemory: any) {
	for (let i = 0; i < initialMemory.length; i++) {
		memory[i] = initialMemory[i];
	}
};

export const initializeMemory = function (modules) {
	const memoryRef = new WebAssembly.Memory({ initial: 1 });
	const memoryBuffer = new Int32Array(memoryRef.buffer);

	// @ts-ignore flat
	const initialMemory = modules.map(({ initialMemory }) => initialMemory).flat();

	setInitialMemory(memoryBuffer, initialMemory);

	return { memoryRef, memoryBuffer };
};
