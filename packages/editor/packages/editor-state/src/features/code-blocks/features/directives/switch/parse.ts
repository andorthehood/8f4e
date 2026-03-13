export interface SwitchDirectiveData {
	id: string;
	lineNumber: number;
	onValue: number;
	offValue: number;
}

export function createSwitchDirectiveData(args: string[], lineNumber: number): SwitchDirectiveData {
	return {
		id: args[0],
		lineNumber,
		offValue: parseInt(args[1], 10) || 0,
		onValue: parseInt(args[2], 10) || 1,
	};
}

export default function parseSwitchDirectives(code: string[]): SwitchDirectiveData[] {
	return code.reduce((acc, line, index) => {
		const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
		if (commentMatch && commentMatch[1] === 'switch') {
			return [...acc, createSwitchDirectiveData(commentMatch[2].trim().split(/\s+/), index)];
		}

		return acc;
	}, [] as SwitchDirectiveData[]);
}
