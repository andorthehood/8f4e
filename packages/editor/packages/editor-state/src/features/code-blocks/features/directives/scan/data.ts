export interface ScanDirectiveData {
	bufferMemoryId: string;
	pointerMemoryId: string;
	lineNumber: number;
}

export function createScanDirectiveData(args: string[], lineNumber: number): ScanDirectiveData {
	return {
		bufferMemoryId: args[0],
		pointerMemoryId: args[1],
		lineNumber,
	};
}
