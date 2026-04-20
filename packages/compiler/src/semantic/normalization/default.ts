import { normalizeDefaultLine } from './helpers';

import { type CompilationContext, type DefaultLine, type NormalizedDefaultLine } from '../../types';

export default function normalizeDefault(
	line: DefaultLine,
	context: CompilationContext
): NormalizedDefaultLine | DefaultLine {
	return normalizeDefaultLine(line, context);
}
