import { ArgumentType, parseLine } from '@8f4e/tokenizer';

export interface WatchDirectiveData {
	id: string;
	lineNumber: number;
}

function inferWatchIdFromSourceLine(sourceLine: string, lineNumber: number): string | undefined {
	try {
		const parsedLine = parseLine(sourceLine, lineNumber);
		const [firstArg] = parsedLine.arguments;

		if (!parsedLine.isMemoryDeclaration || !firstArg) {
			return undefined;
		}

		if (firstArg.type === ArgumentType.IDENTIFIER && firstArg.referenceKind === 'plain') {
			return firstArg.value;
		}

		if (firstArg.type === ArgumentType.LITERAL) {
			return '__anonymous__' + lineNumber;
		}

		if (
			firstArg.type === ArgumentType.IDENTIFIER &&
			firstArg.referenceKind === 'constant' &&
			parsedLine.arguments.length > 1
		) {
			return '__anonymous__' + lineNumber;
		}

		return undefined;
	} catch {
		return undefined;
	}
}

export function createWatchDirectiveData(
	args: string[],
	lineNumber: number,
	sourceLine?: string
): WatchDirectiveData | undefined {
	const id = args[0] ?? (sourceLine ? inferWatchIdFromSourceLine(sourceLine, lineNumber) : undefined);
	if (!id) {
		return undefined;
	}

	return {
		id,
		lineNumber,
	};
}
