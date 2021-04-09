import {
	Instruction,
	Type,
	createFunctionBody,
	createLocalDeclaration,
	i32const,
	i32load,
	i32store,
	ifelse,
	localGet,
	localSet,
} from '../../../byteCodeUtils/src';
import { ModuleGenerator } from '../types';

export const enum Memory {
	DEFAULT_VALUE,
	INPUT_POINTER,
	TRIGGER_INPUT_POINTER,
	TRIGGER_PREVIOUS_VALUE,
	OUTPUT,
}

const enum Locals {
	TRIGGER_INPUT,
	__LENGTH,
}

const sampleAndHold: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset(Memory.TRIGGER_INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.TRIGGER_INPUT),

			// Determining wether the signal is high
			...localGet(Locals.TRIGGER_INPUT),
			...i32const(offset(Memory.TRIGGER_PREVIOUS_VALUE)),
			...i32load(),
			Instruction.I32_SUB,
			...i32const(1000),
			Instruction.I32_GE_S,
			...ifelse(Type.VOID, [
				...i32const(offset(Memory.OUTPUT)),
				...i32const(offset(Memory.INPUT_POINTER)),
				...i32load(),
				...i32load(),
				...i32store(),
			]),

			...i32const(offset(Memory.TRIGGER_PREVIOUS_VALUE)),
			...localGet(Locals.TRIGGER_INPUT),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [0, offset(Memory.DEFAULT_VALUE), offset(Memory.DEFAULT_VALUE), 0, 0],
		memoryAddresses: [
			{ address: offset(Memory.OUTPUT), id: 'out' },
			{
				address: offset(Memory.INPUT_POINTER),
				id: 'in',
				default: offset(Memory.DEFAULT_VALUE),
			},
			{
				address: offset(Memory.TRIGGER_INPUT_POINTER),
				id: 'in:trigger',
				default: offset(Memory.DEFAULT_VALUE),
			},
		],
	};
};

export default sampleAndHold;
