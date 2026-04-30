import { ErrorCode, getError } from '../compilerError';

import type { InstructionCompiler } from '@8f4e/compiler-types';

export default function assertFunctionMemoryIoAllowed(
	line: Parameters<InstructionCompiler>[0],
	context: Parameters<InstructionCompiler>[1]
): void {
	if (context.mode === 'function' && !context.currentFunctionIsImpure) {
		throw getError(ErrorCode.IMPURE_DIRECTIVE_REQUIRED_FOR_MEMORY_IO, line, context);
	}
}
