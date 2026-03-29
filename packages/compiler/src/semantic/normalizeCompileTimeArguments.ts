import dispatchNormalization from './normalization';

import type { AST, CompilationContext, NormalizedLine } from '../types';

export default function normalizeCompileTimeArguments<TLine extends AST[number]>(
	line: TLine,
	context: CompilationContext
): NormalizedLine<TLine> {
	return dispatchNormalization(line, context);
}
