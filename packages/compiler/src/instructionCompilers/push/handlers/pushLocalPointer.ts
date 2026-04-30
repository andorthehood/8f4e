import { localGet } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from '../../assertFunctionMemoryIoAllowed';
import { saveByteCode } from '../../../utils/compilation';
import { buildPointerDereferenceByteCode, kindToStackItem } from '../shared';

import type { CompilationContext, PushIdentifierLine } from '@8f4e/compiler-types';

export default function pushLocalPointer(line: PushIdentifierLine, context: CompilationContext): CompilationContext {
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
	context.stack.push(kindToStackItem(dereference.kind, { isNonZero: false }));

	return saveByteCode(context, dereference.byteCode);
}
