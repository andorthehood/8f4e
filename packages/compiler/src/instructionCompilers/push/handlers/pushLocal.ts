import { localGet } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../../../utils/compilation';

import type { CompilationContext, PushIdentifierLine } from '../../../types';

export default function pushLocal(line: PushIdentifierLine, context: CompilationContext): CompilationContext {
	const local = context.locals[line.arguments[0].value]!;

	context.stack.push({
		isInteger: local.isInteger,
		...(local.isFloat64 ? { isFloat64: true } : {}),
		isNonZero: false,
	});
	return saveByteCode(context, localGet(local.index));
}
