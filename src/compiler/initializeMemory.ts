export const generateOutputAddressLookup = function (compiledModules) {
	const lookup = {};
	compiledModules.forEach(({ memoryAddresses, moduleId }) => {
		memoryAddresses.forEach(({ id, address }) => {
			lookup[moduleId + id] = address;
		});
	});
	return lookup;
};

export const setUpConnections = function (memoryBuffer, compiledModules, connections) {
	connections.forEach(connection => {
		const toModule = compiledModules.find(({ moduleId }) => moduleId === connection.toModule);

		if (!toModule) {
			return;
		}

		const toConnector = toModule.memoryAddresses.find(({ id }) => id === connection.toConnector);
		const inputPointerAddressInBuffer = toConnector.address / Int32Array.BYTES_PER_ELEMENT;

		const fromModule = compiledModules.find(({ moduleId }) => moduleId === connection.fromModule);
		const fromConnector = fromModule.memoryAddresses.find(({ id }) => id === connection.fromConnector);
		const outputAddress = fromConnector.address;

		memoryBuffer[inputPointerAddressInBuffer] = outputAddress;
	});
};
