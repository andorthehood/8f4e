import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../compilerError';

import type { CompilerASTLine, CodegenContext, CompilationContext } from '@8f4e/compiler-spec';

export default function assertFunctionMemoryIoAllowed(
	line: CompilerASTLine,
	context: CodegenContext | CompilationContext
): void {
	if (context.mode === 'function' && !context.currentFunctionIsImpure) {
		throw getError(ErrorCode.IMPURE_DIRECTIVE_REQUIRED_FOR_MEMORY_IO, line, context);
	}
}
