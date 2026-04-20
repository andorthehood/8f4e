import { isMemoryIdentifier } from '@8f4e/compiler-memory-layout';

import { validateOrDeferCompileTimeExpression } from './helpers';

import { ArgumentType, type CompilationContext, type CodegenPushLine, type PushLine } from '../../types';
import { ErrorCode, getError } from '../../compilerError';

/**
 * Normalizes compile-time arguments for the `push` instruction.
 * The value argument (index 0) is normalized.
 * For identifier arguments, validates that the identifier is a known memory item, pointer,
 * memory reference, local, or valid intermodule reference.
 * Throws UNDECLARED_IDENTIFIER for unrecognized identifiers.
 */
export default function normalizePush(line: PushLine, context: CompilationContext): CodegenPushLine {
	const argument = line.arguments[0];
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		validateOrDeferCompileTimeExpression(argument, line, context);
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		const { value, referenceKind } = argument;
		const { memory } = context.namespace;
		if (
			!(referenceKind === 'plain' && isMemoryIdentifier(memory, value)) &&
			!(referenceKind === 'memory-pointer' && isMemoryIdentifier(memory, argument.targetMemoryId)) &&
			!context.locals[value]
		) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: value });
		}
	}

	return line as CodegenPushLine;
}
