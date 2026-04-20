import { normalizePushLine } from './helpers';

import { type CompilationContext, type CodegenPushLine, type PushLine } from '../../types';

export default function normalizePush(line: PushLine, context: CompilationContext): CodegenPushLine {
	return normalizePushLine(line, context) as CodegenPushLine;
}
