import { findWhatIsConnectedTo } from '../../../src/state/helpers/connectionHelpers';

export const generateOutputAddressLookup = function (compiledModules) {
	const lookup = {};
	compiledModules.forEach(({ memoryAddresses, moduleId }) => {
		memoryAddresses.forEach(({ id, address }) => {
			lookup[moduleId + '_' + id] = address;
		});
	});
	return lookup;
};

export const setUpConnections = function (memoryBuffer, compiledModules, connections) {
	compiledModules.forEach(({ memoryAddresses, moduleId }) => {
		memoryAddresses
			.filter(({ id }) => id.startsWith('in'))
			.forEach(({ id, address }) => {
				const output = findWhatIsConnectedTo(connections, moduleId, id);
				if (output) {
					const outputModule = compiledModules.find(({ moduleId }) => moduleId === output.moduleId);
					const outputAddress = outputModule.memoryAddresses.find(({ id }) => id === output.connectorId).address;
					const inputPointerAddressInBuffer = address / Int32Array.BYTES_PER_ELEMENT;
					memoryBuffer[inputPointerAddressInBuffer] = outputAddress;
				}
			});
	});
};
