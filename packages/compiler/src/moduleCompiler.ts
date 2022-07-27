function parseLine(line: string): { instruction: string; arguments: string[] } {
	const [, instruction, ...args] = line.match(/\s*(\S+)\s*(\S*)\s*(\S*)/);

	return {
		instruction,
		arguments: args.filter(argument => {
			return argument !== '';
		}),
	};
}

function isComment(line: string): boolean {
	return /\s*#/.test(line);
}

function isValidInstruction(line: string): boolean {
	return /\s*(\S+)\s*(\S*)\s*(\S*)/.test(line);
}

export function compileToAST(module: string) {
	const lines = module.split('\n');

	return lines
		.filter(line => !isComment(line))
		.filter(line => isValidInstruction(line))
		.map(line => {
			return parseLine(line);
		});
}
