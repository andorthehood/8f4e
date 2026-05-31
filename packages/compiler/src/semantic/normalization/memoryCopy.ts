import {
	ArgumentType,
	type CompilationContext,
	ErrorCode,
	type MemoryCopyLine,
	type NormalizedMemoryCopyLine,
} from '@8f4e/compiler-spec';
import { getError } from '../../compilerError';
import { normalizeAndValidateResolvableArgs } from './helpers';

export default function normalizeMemoryCopy(
	line: MemoryCopyLine,
	context: CompilationContext
): NormalizedMemoryCopyLine | MemoryCopyLine {
	const normalized = normalizeAndValidateResolvableArgs(line, context, [0]);

	const argument = normalized.arguments[0];
	if (argument?.type === ArgumentType.LITERAL && !argument.isInteger) {
		throw getError(ErrorCode.TYPE_MISMATCH, line, context);
	}
	if (argument?.type === ArgumentType.LITERAL && argument.value < 0) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	return normalized as NormalizedMemoryCopyLine | MemoryCopyLine;
}
