import { saveByteCode } from '../../../utils/compilation';
import { constOpcode, kindToStackItem, resolveArgumentValueKind } from '../shared';

import type { ArgumentLiteral, CompilationContext } from '../../../types';

export default function pushLiteral(argument: ArgumentLiteral, context: CompilationContext): CompilationContext {
	const kind = resolveArgumentValueKind(argument);
	context.stack.push(kindToStackItem(kind, { isNonZero: argument.value !== 0 }));
	return saveByteCode(context, constOpcode[kind](argument.value));
}
