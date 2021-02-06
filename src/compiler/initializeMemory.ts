const generateOutputAddressLookup = function (compiledModules) {
	const lookup = {};
	compiledModules.forEach(({ outputs, moduleId }) => {
		lookup[moduleId] = outputs.map(output => ({ outputId: output.id, memoryAddress: output.address }));
	});
	return lookup;
};

export const setInitialMemory = function (memory: any, initialMemory: any) {
	for (let i = 0; i < initialMemory.length; i++) {
		memory[i] = initialMemory[i];
	}
};

export const initializeMemory = function (compiledModules, connections) {
	const memoryRef = new WebAssembly.Memory({ initial: 1 });
	const memoryBuffer = new Int32Array(memoryRef.buffer);

	const initialMemory = compiledModules.map(({ initialMemory }) => initialMemory).flat();

	setInitialMemory(memoryBuffer, initialMemory);

	const outputAddressLookup = generateOutputAddressLookup(compiledModules);

	return { memoryRef, memoryBuffer, outputAddressLookup };
};
