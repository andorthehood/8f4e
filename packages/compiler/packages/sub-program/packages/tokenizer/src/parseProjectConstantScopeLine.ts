import { ArgumentType, type ProjectConstantScopeLine, projectInstructions } from '@8f4e/language-spec';
import { parseInstructionSourceLine, withSyntaxLine } from './parseLine';
import isConstantName from './syntax/isConstantName';
import { SyntaxErrorCode, SyntaxRulesError } from './syntax/syntaxError';
import validateInstructionArguments from './syntax/validateInstructionArguments';

/** Parses one project-scope `const` or `pass` declaration. */
export function parseProjectConstantScopeLine(line: string, lineNumber: number): ProjectConstantScopeLine {
	const parsed = parseInstructionSourceLine(line, lineNumber);

	try {
		if (parsed.instruction === 'const') {
			validateInstructionArguments(parsed.instruction, parsed.arguments);
			return { lineNumber, ...parsed } as ProjectConstantScopeLine;
		}

		if (parsed.instruction !== projectInstructions.pass) {
			throw new SyntaxRulesError(SyntaxErrorCode.UNRECOGNISED_INSTRUCTION);
		}
		if (parsed.arguments.length === 0) {
			throw new SyntaxRulesError(SyntaxErrorCode.MISSING_ARGUMENT, 'Missing required argument for pass.');
		}
		if (parsed.arguments.length > 1) {
			throw new SyntaxRulesError(SyntaxErrorCode.INVALID_ARGUMENT, 'Too many arguments for pass.');
		}

		const [name] = parsed.arguments;
		if (name.type !== ArgumentType.IDENTIFIER || !isConstantName(name.value)) {
			throw new SyntaxRulesError(
				SyntaxErrorCode.INVALID_ARGUMENT,
				'Invalid argument for pass: expected constant identifier.'
			);
		}

		return {
			lineNumber,
			instruction: projectInstructions.pass,
			arguments: [name],
		};
	} catch (error) {
		if (error instanceof SyntaxRulesError) {
			throw withSyntaxLine(error, lineNumber, parsed.instruction);
		}
		throw error;
	}
}
