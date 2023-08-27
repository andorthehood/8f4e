import { Instruction, instructionParser } from '@8f4e/compiler';

import { parseCode } from './multiLineCodeParser';

import { ExtendedInstructionSet } from '../types';

export function parseInputs(code: string[]): Array<{ id: string; lineNumber: number }> {
	return code.reduce((acc, line, index) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, Instruction, string, string];

		if (instruction === 'int*' || instruction === 'float*' || instruction === 'int**' || instruction === 'float**') {
			return [...acc, { id: args[0], lineNumber: index }];
		}
		return acc;
	}, []);
}

export function parseOutputs(code: string[]): Array<{ id: string; lineNumber: number }> {
	return code.reduce((acc, line, index) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, Instruction, string, string];

		if (instruction === 'int' || instruction === 'float' || instruction === 'int[]' || instruction === 'float[]') {
			return [...acc, { id: args[0], lineNumber: index }];
		}
		return acc;
	}, []);
}

export function parseSwitches(
	code: string[]
): Array<{ id: string; lineNumber: number; onValue: number; offValue: number }> {
	return code.reduce((acc, line, index) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [
			never,
			Instruction | ExtendedInstructionSet,
			string,
			string,
			string
		];

		if (instruction === 'switch') {
			return [
				...acc,
				{ id: args[0], lineNumber: index, onValue: parseInt(args[2], 10) || 1, offValue: parseInt(args[1], 10) || 0 },
			];
		}
		return acc;
	}, []);
}

export function parseDebuggers(code: string[]): Array<{ id: string; lineNumber: number }> {
	return code.reduce((acc, line, index) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [
			never,
			Instruction | ExtendedInstructionSet,
			string,
			string
		];

		if (instruction === 'debug') {
			return [...acc, { id: args[0], lineNumber: index }];
		}
		return acc;
	}, []);
}

export function parseButtons(
	code: string[]
): Array<{ id: string; lineNumber: number; onValue: number; offValue: number }> {
	return code.reduce((acc, line, index) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [
			never,
			Instruction | ExtendedInstructionSet,
			string,
			string,
			string
		];

		if (instruction === 'button') {
			return [
				...acc,
				{ id: args[0], lineNumber: index, onValue: parseInt(args[2], 10) || 1, offValue: parseInt(args[1], 10) || 0 },
			];
		}
		return acc;
	}, []);
}

export function parsePositionOffsetters(code: string[]): Array<{ axis: string; memory: string }> {
	return code.reduce((acc, line) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [
			never,
			Instruction | ExtendedInstructionSet,
			string,
			string,
			string
		];

		if (instruction === 'offset') {
			return [...acc, { axis: args[0], memory: args[1] }];
		}
		return acc;
	}, []);
}

export function parseBufferPlotters(code: string[]): Array<{
	bufferMemoryId: string;
	lineNumber: number;
	minValue: number;
	maxValue: number;
	bufferLengthMemoryId: string | undefined;
}> {
	return code.reduce((acc, line, index) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [
			never,
			Instruction | ExtendedInstructionSet,
			string,
			string,
			string,
			string | undefined
		];

		if (instruction === 'plot') {
			return [
				...acc,
				{
					bufferMemoryId: args[0],
					lineNumber: index,
					minValue: parseInt(args[1], 10) || -8,
					maxValue: parseInt(args[2], 10) || 8,
					bufferLengthMemoryId: args[3] || undefined,
				},
			];
		}

		return acc;
	}, []);
}

export function parsePressedKeys(code: string[], pressedKeysListMemoryId: string, startingNumber: number) {
	const pressedKeys = new Set<number>();

	const pattern = [`init ${pressedKeysListMemoryId}[:index] :key`];

	parseCode(code, pattern).forEach(({ key }) => {
		pressedKeys.add(parseInt(key, 10) - startingNumber);
	});

	return pressedKeys;
}

export function parsePianoKeyboards(code: string[]): Array<{
	id: string;
	lineNumber: number;
	pressedNumberOfKeysMemoryId: string;
	pressedKeysListMemoryId: string;
	pressedKeys: Set<number>;
	startingNumber: number;
}> {
	return code.reduce((acc, line, index) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [
			never,
			Instruction | ExtendedInstructionSet,
			string,
			string,
			string
		];

		if (instruction === 'piano') {
			const startingNumber = parseInt(args[2] || '0', 10);
			const pressedKeys = parsePressedKeys(code, args[0], startingNumber);

			return [
				...acc,
				{
					id: args[0],
					lineNumber: index,
					pressedNumberOfKeysMemoryId: args[1],
					pressedKeysListMemoryId: args[0],
					startingNumber,
					pressedKeys,
				},
			];
		}
		return acc;
	}, []);
}

export function getLastMemoryInstructionLine(code: string[]): number {
	// @ts-ignore
	return code.findLastIndex(line => {
		return /^\s*memory/.test(line);
	});
}

export function getLongestLineLength(code: string[]): number {
	return code.reduce((longestLength, line) => (line.length > longestLength ? line.length : longestLength), 0);
}

export function getModuleId(code: string[]): string {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, ...args] = code[i].match(/\s*(\S+)\s*(\S*)\s*(\S*)\s*(\S*)/) || [];
		if (instruction === 'module') {
			return args[0] || '';
		}
	}
	return '';
}
