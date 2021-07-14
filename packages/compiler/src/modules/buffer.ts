import { i32load, i32const, i32store, createFunctionBody } from 'bytecode-utils';
import { ModuleGenerator, ModuleStateInserter, ModuleStateExtractor, MemoryTypes } from '../types';

enum Memory {
	ZERO,
	NUMBER_OF_INPUTS,
	NUMBER_OF_OUTPUTS,
	NUMBER_OF_DATA_PLACEHOLDERS,
	START_OF_PORTS_AND_PLACEHOLDERS,
}

export interface Config {
	numberOfPorts?: number;
	numberOfDataPlaceholders?: number;
}

interface BufferState {
	[key: string]: number;
}

export const insertState: ModuleStateInserter<BufferState> = function (moduleState, memoryBuffer, moduleAddress) {
	const numberOfInputs = memoryBuffer[moduleAddress / memoryBuffer.BYTES_PER_ELEMENT + Memory.NUMBER_OF_INPUTS];
	const numberOfOutputs = memoryBuffer[moduleAddress / memoryBuffer.BYTES_PER_ELEMENT + Memory.NUMBER_OF_OUTPUTS];
	const numberOfDataPlaceholders =
		memoryBuffer[moduleAddress / memoryBuffer.BYTES_PER_ELEMENT + Memory.NUMBER_OF_DATA_PLACEHOLDERS];
	const startAddressOfOutputs =
		moduleAddress / memoryBuffer.BYTES_PER_ELEMENT + Memory.START_OF_PORTS_AND_PLACEHOLDERS + numberOfInputs;
	const dataPlaceholdersStartAddress = startAddressOfOutputs + numberOfOutputs;

	Object.entries(moduleState)
		.slice(0, numberOfDataPlaceholders)
		.forEach(([key, value]) => {
			memoryBuffer[dataPlaceholdersStartAddress + parseInt(key.split(':')[1], 10) - 1] = value;
		});
};

export const extractState: ModuleStateExtractor<BufferState> = function (memoryBuffer, moduleAddress) {
	const numberOfInputs = memoryBuffer[moduleAddress / memoryBuffer.BYTES_PER_ELEMENT + Memory.NUMBER_OF_INPUTS];
	const numberOfOutputs = memoryBuffer[moduleAddress / memoryBuffer.BYTES_PER_ELEMENT + Memory.NUMBER_OF_OUTPUTS];
	const numberOfDataPlaceholders =
		memoryBuffer[moduleAddress / memoryBuffer.BYTES_PER_ELEMENT + Memory.NUMBER_OF_DATA_PLACEHOLDERS];
	const dataPlaceholdersStartAddress =
		moduleAddress / memoryBuffer.BYTES_PER_ELEMENT +
		Memory.START_OF_PORTS_AND_PLACEHOLDERS +
		numberOfInputs +
		numberOfOutputs;

	const obj = {};

	memoryBuffer
		.slice(dataPlaceholdersStartAddress, dataPlaceholdersStartAddress + numberOfDataPlaceholders)
		.forEach((value, index) => {
			obj['data:' + (index + 1)] = value;
		});

	return obj;
};

const buffer: ModuleGenerator<Config, Memory> = function (moduleId, offset, config = {}) {
	const { numberOfPorts = 1, numberOfDataPlaceholders = 1 } = config;
	const portIndexes = new Array(numberOfPorts).fill(0).map((item, index) => index);
	const dataPlaceholderIndexes = new Array(numberOfDataPlaceholders).fill(0).map((item, index) => index);

	const startAddressOfOutputs = Memory.START_OF_PORTS_AND_PLACEHOLDERS + numberOfPorts;
	const startAddressOfDataPlaceholders = Memory.START_OF_PORTS_AND_PLACEHOLDERS + 2 * numberOfPorts;

	const inputPointers = portIndexes.map(index => Memory.START_OF_PORTS_AND_PLACEHOLDERS + index);
	const outputs = portIndexes.map(index => startAddressOfOutputs + index);
	const dataPlaceholders = dataPlaceholderIndexes.map(index => startAddressOfDataPlaceholders + index);

	const functionBody = createFunctionBody(
		[],
		portIndexes
			.map(index => [
				...i32const(outputs[index]),
				...i32const(inputPointers[index]),
				...i32load(),
				...i32load(),
				...i32store(),
			])
			.flat()
	);

	return {
		moduleId,
		functionBody,
		byteAddress: offset.byte(0),
		wordAddress: offset.word(0),
		memoryMap: [
			{ type: MemoryTypes.PRIVATE, address: Memory.ZERO, default: 0 },
			{ type: MemoryTypes.NUMBER, address: Memory.NUMBER_OF_INPUTS, default: numberOfPorts },
			{ type: MemoryTypes.NUMBER, address: Memory.NUMBER_OF_OUTPUTS, default: numberOfPorts },
			{ type: MemoryTypes.NUMBER, address: Memory.NUMBER_OF_DATA_PLACEHOLDERS, default: numberOfDataPlaceholders },
			...inputPointers.map((address, index) => ({
				type: MemoryTypes.INPUT_POINTER,
				address,
				id: 'in:' + (index + 1),
				default: offset.byte(Memory.ZERO),
			})),
			...outputs.map((address, index) => ({ type: MemoryTypes.OUTPUT, address, id: 'out:' + (index + 1), default: 0 })),
			...dataPlaceholders.map((address, index) => ({
				type: MemoryTypes.NUMBER,
				address,
				id: 'data:' + (index + 1),
				default: 0,
			})),
		],
	};
};

export default buffer;
