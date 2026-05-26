import dispatchNormalization from './normalization';

import type { CompilerASTLine, CompilationContext, NormalizedLine } from '@8f4e/compiler-spec';

export default function normalizeCompileTimeArguments<TLine extends CompilerASTLine>(
	line: TLine,
	context: CompilationContext
): NormalizedLine<TLine> {
	return dispatchNormalization(line, context);
}
