export interface WaveDirectiveData {
	startAddressMemoryId: string;
	length: number | string;
	pointerMemoryId?: string;
	lineNumber: number;
}

export function createWaveDirectiveData(args: string[], lineNumber: number): WaveDirectiveData | undefined {
	if (!args[0] || !args[1]) {
		return undefined;
	}

	const parsedLength = /^-?\d+$/.test(args[1]) ? Number.parseInt(args[1], 10) : args[1];
	if (typeof parsedLength === 'number' && parsedLength <= 0) {
		return undefined;
	}

	return {
		startAddressMemoryId: args[0],
		length: parsedLength,
		pointerMemoryId: args[2],
		lineNumber,
	};
}
