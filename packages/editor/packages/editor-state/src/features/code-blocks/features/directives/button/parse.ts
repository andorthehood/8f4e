export interface ButtonDirectiveData {
	id: string;
	lineNumber: number;
	onValue: number;
	offValue: number;
}

export function createButtonDirectiveData(args: string[], lineNumber: number): ButtonDirectiveData {
	return {
		id: args[0],
		lineNumber,
		offValue: parseInt(args[1], 10) || 0,
		onValue: parseInt(args[2], 10) || 1,
	};
}

export default function parseButtonDirectives(code: string[]): ButtonDirectiveData[] {
	return code.reduce((acc, line, index) => {
		const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
		if (commentMatch && commentMatch[1] === 'button') {
			return [...acc, createButtonDirectiveData(commentMatch[2].trim().split(/\s+/), index)];
		}

		return acc;
	}, [] as ButtonDirectiveData[]);
}
