import {
	ArgumentType,
	isValidModuleName,
	type ProjectMemoryInitializerLine,
	projectInstructions,
} from '@8f4e/language-spec';
import { parseInstructionSourceLine, withSyntaxLine } from './parseLine';
import { SyntaxErrorCode, SyntaxRulesError } from './syntax/syntaxError';

/** Parses a group initializer with an exposed destination and a numeric or parent-scope address value. */
export function parseProjectMemoryInitializerLine(line: string, lineNumber: number): ProjectMemoryInitializerLine {
	const parsed = parseInstructionSourceLine(line, lineNumber);
	try {
		if (parsed.instruction !== projectInstructions.init) {
			throw new SyntaxRulesError(SyntaxErrorCode.UNRECOGNISED_INSTRUCTION);
		}
		const [destination, source] = parsed.arguments;
		if (
			parsed.arguments.length !== 2 ||
			destination?.type !== ArgumentType.IDENTIFIER ||
			destination.referenceKind !== 'memory-reference' ||
			destination.isEndAddress ||
			(source?.type !== ArgumentType.LITERAL &&
				(source?.type !== ArgumentType.IDENTIFIER ||
					source.referenceKind !== 'intermodular-reference' ||
					source.isEndAddress ||
					!isValidModuleName(source.targetModuleId)))
		) {
			throw new SyntaxRulesError(SyntaxErrorCode.INVALID_PROJECT_MEMORY_INITIALIZER);
		}
		return { lineNumber, instruction: projectInstructions.init, arguments: [destination, source] };
	} catch (error) {
		if (error instanceof SyntaxRulesError) throw withSyntaxLine(error, lineNumber, parsed.instruction);
		throw error;
	}
}
