export interface WatchDirectiveData {
	id: string;
	lineNumber: number;
}

export function createWatchDirectiveData(args: string[], lineNumber: number): WatchDirectiveData {
	return {
		id: args[0],
		lineNumber,
	};
}
