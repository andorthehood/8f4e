import { ArgumentType, parseLine } from '@8f4e/tokenizer';

export interface WatchDirectiveData {
	id: string;
	lineNumber: number;
}

function inferWatchIdFromSourceLine(sourceLine: string): string | undefined {
	try {
		const parsedLine = parseLine(sourceLine, 0);
		const [firstArg] = parsedLine.arguments;

		if (
			!parsedLine.isMemoryDeclaration ||
			firstArg?.type !== ArgumentType.IDENTIFIER ||
			firstArg.referenceKind !== 'plain'
		) {
			return undefined;
		}

		return firstArg.value;
	} catch {
		return undefined;
	}
}

export function createWatchDirectiveData(
	args: string[],
	lineNumber: number,
	sourceLine?: string
): WatchDirectiveData | undefined {
	const id = args[0] ?? (sourceLine ? inferWatchIdFromSourceLine(sourceLine) : undefined);
	if (!id) {
		return undefined;
	}

	return {
		id,
		lineNumber,
	};
}
