import { localGet } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../../utils/saveByteCode';

import type { CodegenContext, PushIdentifierLine } from '@8f4e/compiler-spec';

export default function pushLocal(line: PushIdentifierLine, context: CodegenContext): CodegenContext {
	const local = context.locals[line.arguments[0].value]!;

	return saveByteCode(context, localGet(local.index));
}
