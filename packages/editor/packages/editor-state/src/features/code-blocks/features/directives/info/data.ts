export interface InfoDirectiveData {
	id: string;
	lineNumber: number;
}

export function createInfoDirectiveData(args: string[], lineNumber: number): InfoDirectiveData | undefined {
	const id = args[0];

	if (!id) {
		return undefined;
	}

	return {
		id,
		lineNumber,
	};
}
