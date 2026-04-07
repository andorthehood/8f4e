export interface NthDirectiveData {
	lineNumber: number;
}

export function createNthDirectiveData(args: string[], lineNumber: number): NthDirectiveData | undefined {
	if (args.length > 0) {
		return undefined;
	}

	return {
		lineNumber,
	};
}
