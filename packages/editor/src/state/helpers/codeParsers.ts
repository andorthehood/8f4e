export function getLastMemoryInstructionLine(code: string[]): number {
	// Find last index where the line matches the memory pattern
	for (let i = code.length - 1; i >= 0; i--) {
		if (/^\s*memory/.test(code[i])) {
			return i;
		}
	}
	return -1;
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
