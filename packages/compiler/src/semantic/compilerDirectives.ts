import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../compilerError';

import type { AST, CompilationContext } from '@8f4e/compiler-spec';

export const moduleCompilerDirectives = ['#skipExecution', '#initOnly', '#loopCap'] as const;
export const functionCompilerDirectives = ['#impure', '#export', '#loopCap'] as const;

export function assertCompilerDirectiveInPrologue(line: AST[number], context: CompilationContext): void {
	if (!line.isBlockPrologue) {
		throw getError(ErrorCode.COMPILER_DIRECTIVE_MUST_BE_PROLOGUE, line, context);
	}
}
