import { ArgumentType, parseLine } from '@8f4e/tokenizer';

export interface MeterDirectiveData {
	memoryId: string;
	lineNumber: number;
	minValueOverride?: number;
	maxValueOverride?: number;
}

function inferMeterIdFromSourceLine(sourceLine: string, lineNumber: number): string | undefined {
	try {
		const parsedLine = parseLine(sourceLine, lineNumber);
		const [firstArg] = parsedLine.arguments;

		if (!parsedLine.isMemoryDeclaration) {
			return undefined;
		}

		if (!firstArg) {
			return '__anonymous__' + lineNumber;
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

export function createMeterDirectiveData(
	args: string[],
	lineNumber: number,
	sourceLine?: string
): MeterDirectiveData | undefined {
	const inferredId = sourceLine ? inferMeterIdFromSourceLine(sourceLine, lineNumber) : undefined;
	const memoryId = args[0] ?? inferredId;

	if (!memoryId) {
		return undefined;
	}

	if (args.length === 0 || args.length === 1) {
		return {
			memoryId,
			lineNumber,
		};
	}

	if (args.length !== 3) {
		return undefined;
	}

	if (!/^-?\d*\.?\d+$/.test(args[1]) || !/^-?\d*\.?\d+$/.test(args[2])) {
		return undefined;
	}

	return {
		memoryId,
		lineNumber,
		minValueOverride: Number.parseFloat(args[1]),
		maxValueOverride: Number.parseFloat(args[2]),
	};
}
