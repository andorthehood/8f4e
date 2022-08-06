import {
	createFunctionBody,
	createLocalDeclaration,
	i32const,
	i32load,
	i32store,
	ifelse,
	Instruction,
	localGet,
	localSet,
	Type,
} from 'bytecode-utils';
import { MemoryTypes, ModuleGenerator, ModuleStateExtractor, ModuleStateInserter } from '../types';

export enum Memory {
	ZERO,
	TRIGGER_INPUT_POINTER,
	TRIGGER_PREVIOUS_VALUE,
	OUTPUT,
	PATTERN_POINTER,
	PATTERN_MEMORY_SIZE,
	PATTERN_START,
}

enum Locals {
	TRIGGER_INPUT,
	PATTERN_POINTER,
	__LENGTH,
}

export interface Config {
	maxPatternSizeToAlloc: number;
}

const triggerSequencer: ModuleGenerator<Config> = function (moduleId, offset, { maxPatternSizeToAlloc }) {
	const pattern = new Array(maxPatternSizeToAlloc).fill(0);

	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset.byte(Memory.OUTPUT)),
			...i32const(0),
			...i32store(),

			...i32const(offset.byte(Memory.PATTERN_POINTER)),
			...i32load(),
			...localSet(Locals.PATTERN_POINTER),

			...i32const(offset.byte(Memory.TRIGGER_INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.TRIGGER_INPUT),

			// Determining wether the signal is high
			...i32const(offset.byte(Memory.TRIGGER_PREVIOUS_VALUE)),
			...i32load(),
			...localGet(Locals.TRIGGER_INPUT),
			Instruction.I32_GT_S,
			...ifelse(Type.VOID, [
				// Increment pattern pointer
				...localGet(Locals.PATTERN_POINTER),
				...i32const(4),
				Instruction.I32_ADD,
				...i32const(offset.byte(Memory.PATTERN_MEMORY_SIZE)),
				...i32load(),
				Instruction.I32_REM_S,
				...localSet(Locals.PATTERN_POINTER),

				// Set output to high if pattern is set
				...i32const(offset.byte(Memory.PATTERN_START)),
				...localGet(Locals.PATTERN_POINTER),
				Instruction.I32_ADD,
				...i32load(),
				...i32const(1),
				Instruction.I32_EQ,
				...ifelse(Type.VOID, [...i32const(offset.byte(Memory.OUTPUT)), ...i32const(30000), ...i32store()]),

				// Save pattern pointer
				...i32const(offset.byte(Memory.PATTERN_POINTER)),
				...localGet(Locals.PATTERN_POINTER),
				...i32store(),
			]),

			...i32const(offset.byte(Memory.TRIGGER_PREVIOUS_VALUE)),
			...localGet(Locals.TRIGGER_INPUT),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		byteAddress: offset.byte(0),
		wordAddress: offset.word(0),
		memoryMap: [
			{ address: Memory.ZERO, default: 0, type: MemoryTypes.PRIVATE },
			{
				id: 'in:trigger',
				address: Memory.TRIGGER_INPUT_POINTER,
				default: offset.byte(Memory.ZERO),
				type: MemoryTypes.INPUT_POINTER,
			},
			{ address: Memory.TRIGGER_PREVIOUS_VALUE, default: 0, type: MemoryTypes.PRIVATE },
			{ id: 'out', address: Memory.OUTPUT, default: 0, type: MemoryTypes.OUTPUT },
			{ address: Memory.PATTERN_POINTER, type: MemoryTypes.PRIVATE, default: 0 },
			{ address: Memory.PATTERN_MEMORY_SIZE, type: MemoryTypes.ARRAY_SIZE, default: maxPatternSizeToAlloc * 4 },
			{
				address: Memory.PATTERN_START,
				type: MemoryTypes.DYNAMIC_ARRAY,
				sizePointer: Memory.PATTERN_MEMORY_SIZE,
				maxSize: maxPatternSizeToAlloc * 4,
				default: pattern,
			},
		],
	};
};

export default triggerSequencer;

interface TriggerSequencerState {
	pattern: boolean[];
}

export const insertState: ModuleStateInserter<TriggerSequencerState> = function (
	moduleState,
	memoryBuffer,
	moduleAddress
) {
	const patternStartAddress = moduleAddress + Memory.PATTERN_START;
	const patternMemorySizeAddress = moduleAddress + Memory.PATTERN_MEMORY_SIZE;

	if (moduleState.pattern.length === 0) {
		memoryBuffer[patternMemorySizeAddress] = 1;
		memoryBuffer[patternStartAddress] = 0;
		return;
	}

	memoryBuffer[patternMemorySizeAddress] = moduleState.pattern.length;

	moduleState.pattern.forEach((item, index) => {
		memoryBuffer[patternStartAddress + index * memoryBuffer.BYTES_PER_ELEMENT] = item ? 1 : 0;
	});
};

export const extractState: ModuleStateExtractor<TriggerSequencerState> = function (memoryBuffer, moduleAddress) {
	const patternStartAddress = moduleAddress + Memory.PATTERN_START;
	const patternMemorySizeAddress = moduleAddress + Memory.PATTERN_MEMORY_SIZE;

	const patternMemorySize = memoryBuffer[patternMemorySizeAddress] / memoryBuffer.BYTES_PER_ELEMENT;
	const pattern = Array.from(memoryBuffer.slice(patternStartAddress, patternStartAddress + patternMemorySize));

	return { pattern: pattern.map(item => item === 1) };
};
