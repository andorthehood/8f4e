import { normalizeArgumentsAtIndexes } from './helpers';

import type { AST, CompilationContext } from '@8f4e/compiler-types';

export default function normalizeClampAddress(line: AST[number], context: CompilationContext): AST[number] {
	return normalizeArgumentsAtIndexes(line, context, [0]).line;
}
