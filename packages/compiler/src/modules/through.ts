import { i32load, i32const, i32store, createFunctionBody } from 'bytecode-utils';
import { ModuleGenerator } from '../types';

enum Memory {
	ZERO,
}

export type ThroughConfig = {
	numberOfPorts?: number;
	dataPlaceholders?: string[];
};

const through: ModuleGenerator = function (
	moduleId,
	offset,
	{ numberOfPorts = 1, dataPlaceholders = [] }: ThroughConfig = {}
) {
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
			...dataPlaceholders.map(() => 0),
		],
		memoryAddresses: [
			...inputPointers.map((address, index) => ({ address, id: 'in:' + (index + 1) })),
			...outputs.map((address, index) => ({ address, id: 'out:' + (index + 1) })),
			...dataPlaceholders.map((id, index) => ({ address: offset(index + 1 + 2 * numberOfPorts), id })),
		],
	};
};

export default through;
