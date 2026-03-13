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

export default function parseWatchDirectives(code: string[]): WatchDirectiveData[] {
	return code.reduce((acc, line, index) => {
		const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
		if (commentMatch && commentMatch[1] === 'watch') {
			return [...acc, createWatchDirectiveData([commentMatch[2].trim()], index)];
		}

		return acc;
	}, [] as WatchDirectiveData[]);
}
