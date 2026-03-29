import dispatchNormalization from './normalization';

import type { AST, CompilationContext } from '../types';

export default function normalizeCompileTimeArguments(line: AST[number], context: CompilationContext): AST[number] {
	return dispatchNormalization(line, context);
}
