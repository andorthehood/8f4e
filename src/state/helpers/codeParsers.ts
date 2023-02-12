const instructionParser = /\s*(\S+)\s*(\S*)\s*(\S*)\s*(\S*)/;

export function parseInputs(code: string[]): Array<{ id: string; lineNumber: number }> {
	return code.reduce((acc, line, index) => {
		const [, instruction, ...args] = line.match(instructionParser) ?? [];

		if (instruction === 'memory' && args[0].includes('in')) {
			return [...acc, { id: args[0], lineNumber: index }];
		}
		return acc;
	}, []);
}

export function parseOutputs(code: string[]): Array<{ id: string; lineNumber: number }> {
	return code.reduce((acc, line, index) => {
		const [, instruction, ...args] = line.match(instructionParser) ?? [];

		if (instruction === 'memory' && args[0].includes('out')) {
			return [...acc, { id: args[0], lineNumber: index }];
		}
		return acc;
	}, []);
}
