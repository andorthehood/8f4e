import { parseInstructionTokens } from './parseLine';
import isComment from './syntax/isComment';
import isInstructionLikeLine from './syntax/isInstructionLikeLine';
import { SyntaxErrorCode, SyntaxRulesError } from './syntax/syntaxError';

/** Physical source line after comment filtering and argument-continuation folding. */
export type SourceLine = {
	line: string;
	lineNumber: number;
};

/** Detects physical lines that append one argument to the preceding instruction. */
function isArgumentContinuationCandidate(line: string): boolean {
	return /^\s*-(?=\s|;|$)/.test(line);
}

/**
 * Removes comments and folds argument-continuation lines into logical source lines.
 *
 * @param code - Source lines to process.
 * @returns Logical source lines after comments and continuations are processed.
 */
export function foldArgumentContinuationLines(code: string[]): SourceLine[] {
	const sourceLines: SourceLine[] = [];
	let previousSourceLine: SourceLine | undefined;

	for (const [lineNumber, line] of code.map((sourceLine, index) => [index, sourceLine] as const)) {
		if (isComment(line) || !isInstructionLikeLine(line)) {
			continue;
		}

		if (!isArgumentContinuationCandidate(line)) {
			const sourceLine = {
				line,
				lineNumber,
			};
			sourceLines.push(sourceLine);
			previousSourceLine = sourceLine;
			continue;
		}

		const tokens = parseInstructionTokens(line, lineNumber);
		const instruction = '-';

		if (!previousSourceLine) {
			throw new SyntaxRulesError(SyntaxErrorCode.INVALID_ARGUMENT, 'Argument continuation has no instruction.', {
				lineNumber,
				instruction,
			});
		}

		if (tokens.length < 2) {
			throw new SyntaxRulesError(SyntaxErrorCode.MISSING_ARGUMENT, 'Missing argument for continuation.', {
				lineNumber,
				instruction,
			});
		}

		if (tokens.length > 2) {
			throw new SyntaxRulesError(
				SyntaxErrorCode.INVALID_ARGUMENT,
				'Argument continuation accepts exactly one argument.',
				{
					lineNumber,
					instruction,
				}
			);
		}

		previousSourceLine.line = `${previousSourceLine.line} ${tokens[1]}`;
	}

	return sourceLines;
}
