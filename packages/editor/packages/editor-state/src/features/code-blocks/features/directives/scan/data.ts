export interface ScanDirectiveData {
	arrayMemoryId: string;
	pointerMemoryId: string;
	lineNumber: number;
}

export function createScanDirectiveData(args: string[], lineNumber: number): ScanDirectiveData | undefined {
	if (!args[0] || !args[1]) {
		return undefined;
	}

	return {
		arrayMemoryId: args[0],
		pointerMemoryId: args[1],
		lineNumber,
	};
}
