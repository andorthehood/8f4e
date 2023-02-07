import { ModuleStateExtractor, ModuleStateInserter } from './types';

const numberOfInputsAddress = 1;
const numberOfOutputsAddress = 2;
const numberOfDataPlaceholdersAddress = 3;
const startOfPortsAndPLaceholdersAddress = 4;

export interface Config {
	numberOfPorts?: number;
	numberOfDataPlaceholders?: number;
}

interface BufferState {
	[key: string]: number;
}

export const insertState: ModuleStateInserter<BufferState> = function (moduleState, memoryBuffer, moduleAddress) {
	const numberOfInputs = memoryBuffer[moduleAddress + numberOfInputsAddress];
	const numberOfOutputs = memoryBuffer[moduleAddress + numberOfOutputsAddress];
	const numberOfDataPlaceholders = memoryBuffer[moduleAddress + numberOfDataPlaceholdersAddress];
	const startAddressOfOutputs = moduleAddress + startOfPortsAndPLaceholdersAddress + numberOfInputs;
	const dataPlaceholdersStartAddress = startAddressOfOutputs + numberOfOutputs;

	Object.entries(moduleState)
		.slice(0, numberOfDataPlaceholders)
		.forEach(([key, value]) => {
			memoryBuffer[dataPlaceholdersStartAddress + parseInt(key.split(':')[1], 10) - 1] = value;
		});
};

export const extractState: ModuleStateExtractor<BufferState> = function (memoryBuffer, moduleAddress) {
	const numberOfInputs = memoryBuffer[moduleAddress + numberOfInputsAddress];
	const numberOfOutputs = memoryBuffer[moduleAddress + numberOfOutputsAddress];
	const numberOfDataPlaceholders = memoryBuffer[moduleAddress + numberOfDataPlaceholdersAddress];
	const dataPlaceholdersStartAddress =
		moduleAddress + startOfPortsAndPLaceholdersAddress + numberOfInputs + numberOfOutputs;

	const obj = {};

	memoryBuffer
		.slice(dataPlaceholdersStartAddress, dataPlaceholdersStartAddress + numberOfDataPlaceholders)
		.forEach((value, index) => {
			obj['data:' + (index + 1)] = value;
		});

	return obj;
};

export default ({ numberOfPorts = 1, numberOfDataPlaceholders = 1 }) => {
	const ports = new Array(numberOfPorts).fill(0).map((item, index) => index + 1);
	const dataPlaceholders = new Array(numberOfDataPlaceholders).fill(0).map((item, index) => index + 1);

	return `
		module buffer

		private defaultValue 0
		public numberOfInputs ${numberOfPorts}
		public numberOfOutputs ${numberOfPorts}
		public numberOfDataPlaceholders ${numberOfDataPlaceholders}

		${ports
			.map(
				index => `
			inputPointer in:${index} defaultValue
		`
			)
			.join('\n')}

		${ports
			.map(
				index => `
			output out:${index} 0
		`
			)
			.join('\n')}

		${dataPlaceholders
			.map(
				index => `
			public data:${index} 0
		`
			)
			.join('\n')}

		${ports
			.map(
				index => `
			push &out:${index}
			push in:${index}
			store
		`
			)
			.join('\n')}
	`;
};
