import { i32load, i32const, i32store, createFunctionBody } from 'bytecode-utils';
import { ModuleGenerator } from '../types';

enum Memory {
	ZERO,
}

type DataPlaceholder = {
	id: string;
};

type ThroughConfig = {
	numberOfPorts?: number;
	dataPlaceholders?: DataPlaceholder[];
};

const through: ModuleGenerator = function (moduleId, offset, config: ThroughConfig = {}) {
	const { numberOfPorts = 1, dataPlaceholders = [] } = config;
	const portIndexes = new Array(numberOfPorts).fill(0).map((item, index) => index);
	const inputPointers = portIndexes.map(index => offset(1 + index));
	const outputs = portIndexes.map(index => offset(1 + numberOfPorts + index));

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
		offset: offset(0),
		initialMemory: [
			0,
			...portIndexes.map(() => offset(Memory.ZERO)),
			...portIndexes.map(() => 0),
			...dataPlaceholders.map(({ id }) => (typeof config[id] !== 'undefined' ? config[id] : 0)),
		],
		memoryAddresses: [
			...inputPointers.map((address, index) => ({ address, id: 'in:' + (index + 1) })),
			...outputs.map((address, index) => ({ address, id: 'out:' + (index + 1) })),
			...dataPlaceholders.map(({ id }, index) => ({ address: offset(index + 1 + 2 * numberOfPorts), id })),
		],
	};
};

export default through;
