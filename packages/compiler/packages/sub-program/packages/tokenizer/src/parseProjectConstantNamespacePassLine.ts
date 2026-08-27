import {
	ArgumentType,
	isValidModuleName,
	MODULE_NAME_PATTERN,
	type ProjectConstantNamespacePassLine,
	projectInstructions,
} from '@8f4e/language-spec';
import { parseInstructionSourceLine, withSyntaxLine } from './parseLine';
import { SyntaxErrorCode, SyntaxRulesError } from './syntax/syntaxError';

/** Parses one project-scope namespace pass declaration. */
export function parseProjectConstantNamespacePassLine(
	line: string,
	lineNumber: number
): ProjectConstantNamespacePassLine {
	const parsed = parseInstructionSourceLine(line, lineNumber);

	try {
		if (parsed.instruction !== projectInstructions.pass) {
			throw new SyntaxRulesError(SyntaxErrorCode.UNRECOGNISED_INSTRUCTION);
		}
		if (parsed.arguments.length === 0) {
			throw new SyntaxRulesError(SyntaxErrorCode.MISSING_ARGUMENT, 'Missing required namespace for pass.');
		}
		if (parsed.arguments.length > 1) {
			throw new SyntaxRulesError(SyntaxErrorCode.INVALID_ARGUMENT, 'Too many arguments for pass.');
		}

		const [namespace] = parsed.arguments;
		if (namespace.type !== ArgumentType.IDENTIFIER || !isValidModuleName(namespace.value)) {
			throw new SyntaxRulesError(
				SyntaxErrorCode.INVALID_IDENTIFIER,
				`Invalid namespace name. Namespace names must match ${MODULE_NAME_PATTERN}.`
			);
		}

		return {
			lineNumber,
			instruction: projectInstructions.pass,
			arguments: [namespace],
		};
	} catch (error) {
		if (error instanceof SyntaxRulesError) {
			throw withSyntaxLine(error, lineNumber, parsed.instruction);
		}
		throw error;
	}
}
