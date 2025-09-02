export function getLastMemoryInstructionLine(code: string[]): number {
	// Find last index where the line matches the memory pattern
	return code.findLastIndex(line => /^\s*memory/.test(line));
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
