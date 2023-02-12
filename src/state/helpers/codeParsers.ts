import { Instruction } from '@8f4e/compiler';

const instructionParser = /^\s*(\S+)\s*(\S*)\s*(\S*)\s*(\S*)$/;
const commentParser = /^\s*#(.+)$/;
const debuggerParser = /^\s*debug\s*(\S*)$/;

export function parseInputs(code: string[]): Array<{ id: string; lineNumber: number }> {
	return code.reduce((acc, line, index) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, Instruction, string];

		if (instruction === 'memory' && args[0].startsWith('in')) {
			return [...acc, { id: args[0], lineNumber: index }];
		}
		return acc;
	}, []);
}

export function parseOutputs(code: string[]): Array<{ id: string; lineNumber: number }> {
	return code.reduce((acc, line, index) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, Instruction, string];

		if (instruction === 'memory' && args[0].startsWith('out')) {
			return [...acc, { id: args[0], lineNumber: index }];
		}
		return acc;
	}, []);
}

export function parseDebuggers(code: string[]): Array<{ id: string; lineNumber: number }> {
	return code.reduce((acc, line, index) => {
		const [, comment] = (line.match(commentParser) ?? []) as [never, string];

		if (comment && comment.includes('debug')) {
			const [, memoryToDebug] = (comment.match(debuggerParser) ?? []) as [never, string];
			return [...acc, { id: memoryToDebug, lineNumber: index }];
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
