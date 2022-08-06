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
} from '@8f4e/bytecode-utils';
import { MemoryTypes, ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

export enum Memory {
	SEED,
	OUTPUT,
}

enum Locals {
	RANDOM,
	FEEDBACK,
	__LENGTH,
}

const tapPositions = [0, 2, 3, 5];

/* Linear-feedback shift register style random generator. */
const random: ModuleGenerator<{ seed?: number }> = function (moduleId, offset, { seed = 69420 } = {}) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset.byte(Memory.OUTPUT)),
			...i32load(),
			...localSet(Locals.RANDOM),

			...localGet(Locals.RANDOM),
			// The zero state is considered illegal because the counter would remain locked-up.
			0x45, //Instruction.I32_EQZ
			...ifelse(Type.I32, [...i32const(offset.byte(Memory.SEED)), ...i32load()], [...localGet(Locals.RANDOM)]),
			...localSet(Locals.RANDOM),

			...tapPositions
				.map(position => [
					...localGet(Locals.RANDOM),
					...i32const(1 << position),
					Instruction.I32_AND,
					...i32const(position),
					Instruction.I32_SHR_S,
					...localGet(Locals.FEEDBACK),
					Instruction.I32_XOR,
					...localSet(Locals.FEEDBACK),
				])
				.flat(),

			...localGet(Locals.RANDOM),
			...i32const(1),
			Instruction.I32_SHR_U,
			...localSet(Locals.RANDOM),

			...localGet(Locals.FEEDBACK),
			0x45, // Instruction.I32_EQZ
			...ifelse(
				Type.I32,
				[...localGet(Locals.RANDOM)],
				[...localGet(Locals.RANDOM), ...i32const(0b10000000000000000000000000000000), Instruction.I32_OR]
			),
			...localSet(Locals.RANDOM),

			...i32const(offset.byte(Memory.OUTPUT)),
			...localGet(Locals.RANDOM),
			...i32const(I16_SIGNED_LARGEST_NUMBER),
			Instruction.I32_REM_S,
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		byteAddress: offset.byte(0),
		wordAddress: offset.word(0),
		memoryMap: [
			{ type: MemoryTypes.PRIVATE, address: Memory.SEED, default: seed },
			{ type: MemoryTypes.OUTPUT, address: Memory.OUTPUT, id: 'out', default: 0 },
		],
	};
};

export default random;
