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

export default function parseScanDirectives(code: string[]): ScanDirectiveData[] {
	return code.reduce((acc, line, index) => {
		const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
		if (commentMatch && commentMatch[1] === 'scan') {
			const args = commentMatch[2].trim().split(/\s+/);
			return [...acc, createScanDirectiveData(args, index)];
		}

		return acc;
	}, [] as ScanDirectiveData[]);
}
