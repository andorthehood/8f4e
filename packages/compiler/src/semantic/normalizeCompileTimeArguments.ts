import dispatchNormalization from './normalization';

import type { AST, CompilationContext, NormalizedLine } from '@8f4e/compiler-types';

export default function normalizeCompileTimeArguments<TLine extends AST[number]>(
	line: TLine,
	context: CompilationContext
): NormalizedLine<TLine> {
	return dispatchNormalization(line, context);
}
