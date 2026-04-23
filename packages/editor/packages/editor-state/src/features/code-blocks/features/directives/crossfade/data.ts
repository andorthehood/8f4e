export interface CrossfadeDirectiveData {
	leftMemoryId: string;
	rightMemoryId: string;
	lineNumber: number;
}

export function createCrossfadeDirectiveData(args: string[], lineNumber: number): CrossfadeDirectiveData | undefined {
	if (args.length !== 2) {
		return undefined;
	}

	if (!args[0]?.startsWith('&') || !args[1]?.startsWith('&')) {
		return undefined;
	}

	return {
		leftMemoryId: args[0],
		rightMemoryId: args[1],
		lineNumber,
	};
}
