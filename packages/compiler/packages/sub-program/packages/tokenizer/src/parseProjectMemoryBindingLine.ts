import {
	ArgumentType,
	isValidModuleName,
	type ProjectMemoryBindingLine,
	projectInstructions,
} from '@8f4e/language-spec';
import { parseInstructionSourceLine, withSyntaxLine } from './parseLine';
import { SyntaxErrorCode, SyntaxRulesError } from './syntax/syntaxError';

/** Parses a group binding with a local exposed destination and a named parent-scope source. */
export function parseProjectMemoryBindingLine(line: string, lineNumber: number): ProjectMemoryBindingLine {
	const parsed = parseInstructionSourceLine(line, lineNumber);
	try {
		if (parsed.instruction !== projectInstructions.bind) {
			throw new SyntaxRulesError(SyntaxErrorCode.UNRECOGNISED_INSTRUCTION);
		}
		const [destination, source] = parsed.arguments;
		if (
			parsed.arguments.length !== 2 ||
			destination?.type !== ArgumentType.IDENTIFIER ||
			destination.referenceKind !== 'memory-reference' ||
			destination.isEndAddress ||
			source?.type !== ArgumentType.IDENTIFIER ||
			source.referenceKind !== 'intermodular-reference' ||
			source.isEndAddress ||
			!isValidModuleName(source.targetModuleId)
		) {
			throw new SyntaxRulesError(SyntaxErrorCode.INVALID_PROJECT_MEMORY_BINDING);
		}
		return { lineNumber, instruction: projectInstructions.bind, arguments: [destination, source] };
	} catch (error) {
		if (error instanceof SyntaxRulesError) throw withSyntaxLine(error, lineNumber, parsed.instruction);
		throw error;
	}
}
