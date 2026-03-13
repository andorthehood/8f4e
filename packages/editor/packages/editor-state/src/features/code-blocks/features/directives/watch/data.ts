export interface WatchDirectiveData {
	id: string;
	lineNumber: number;
}

export function createWatchDirectiveData(args: string[], lineNumber: number): WatchDirectiveData | undefined {
	if (!args[0]) {
		return undefined;
	}

	return {
		id: args[0],
		lineNumber,
	};
}
