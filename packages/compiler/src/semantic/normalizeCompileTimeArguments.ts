import type { CompilationContext, CompilerASTLine, NormalizedLine } from '@8f4e/compiler-spec';
import dispatchNormalization from './normalization';

export default function normalizeCompileTimeArguments<TLine extends CompilerASTLine>(
	line: TLine,
	context: CompilationContext
): NormalizedLine<TLine> {
	return dispatchNormalization(line, context);
}
