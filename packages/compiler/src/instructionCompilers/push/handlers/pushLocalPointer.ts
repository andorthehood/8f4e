import { localGet } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from '../../assertFunctionMemoryIoAllowed';
import { saveByteCode } from '../../utils/saveByteCode';
import { buildPointerDereferenceByteCode } from '../shared';

import type { CodegenContext, PushIdentifierLine } from '@8f4e/compiler-spec';

export default function pushLocalPointer(line: PushIdentifierLine, context: CodegenContext): CodegenContext {
	const argument = line.arguments[0];
	if (argument.referenceKind !== 'memory-pointer') {
		return context;
	}

	const local = context.locals[argument.targetMemoryId];
	if (!local?.pointeeBaseType) {
		return context;
	}
	assertFunctionMemoryIoAllowed(line, context);
	const dereference = buildPointerDereferenceByteCode(local, localGet(local.index), 'pointer-value');

	return saveByteCode(context, dereference.byteCode);
}
