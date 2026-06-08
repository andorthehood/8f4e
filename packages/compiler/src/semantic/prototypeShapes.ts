import {
	ArgumentType,
	type CompilerASTLine,
	type CompilerDiagnosticContext,
	ErrorCode,
	type MemoryDeclarationLine,
} from '@8f4e/compiler-spec';
import { getError } from '../compilerError';

/**
 * Reads the field id from a prototype memory declaration line.
 *
 * @param line - Prototype memory declaration line to read.
 * @param sourceLine - Instruction that is using the prototype declaration.
 * @param context - Diagnostic context for errors.
 * @returns The prototype memory field id.
 */
export function getPrototypeMemoryDeclarationId(
	line: MemoryDeclarationLine,
	sourceLine: CompilerASTLine,
	context: CompilerDiagnosticContext
): string {
	const idArgument = line.arguments[0];
	if (idArgument.type !== ArgumentType.IDENTIFIER || idArgument.referenceKind !== 'plain') {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, sourceLine, context);
	}

	return idArgument.value;
}
