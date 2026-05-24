import { localGet } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from '../../assertFunctionMemoryIoAllowed';
import { saveByteCode } from '../../utils/saveByteCode';
import { buildPointerDereferenceByteCode } from '../shared';

import type { CodegenContext, MemoryPointerPushLine } from '@8f4e/compiler-spec';

export default function pushLocalPointer(line: MemoryPointerPushLine, context: CodegenContext): CodegenContext {
	const argument = line.arguments[0];
	const local = context.locals[argument.targetMemoryId]!;
	assertFunctionMemoryIoAllowed(line, context);
	const dereference = buildPointerDereferenceByteCode(
		context,
		line.lineNumberAfterMacroExpansion,
		local,
		localGet(local.index),
		'pointer-value'
	);

	return saveByteCode(context, dereference.byteCode);
}
