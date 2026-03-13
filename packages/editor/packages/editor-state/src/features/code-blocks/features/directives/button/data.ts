export interface ButtonDirectiveData {
	id: string;
	lineNumber: number;
	onValue: number;
	offValue: number;
}

export function createButtonDirectiveData(args: string[], lineNumber: number): ButtonDirectiveData | undefined {
	if (!args[0]) {
		return undefined;
	}

	return {
		id: args[0],
		lineNumber,
		offValue: parseInt(args[1], 10) || 0,
		onValue: parseInt(args[2], 10) || 1,
	};
}
