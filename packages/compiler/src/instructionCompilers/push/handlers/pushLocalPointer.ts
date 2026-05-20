import { localGet } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from '../../assertFunctionMemoryIoAllowed';
import { saveByteCode } from '../../utils/saveByteCode';
import { buildPointerDereferenceByteCode } from '../shared';

import type { CodegenContext, PushIdentifierLine } from '@8f4e/compiler-spec';

type MemoryPointerArgument = Extract<PushIdentifierLine['arguments'][number], { referenceKind: 'memory-pointer' }>;

export default function pushLocalPointer(line: PushIdentifierLine, context: CodegenContext): CodegenContext {
	const argument = line.arguments[0] as MemoryPointerArgument;
	const local = context.locals[argument.targetMemoryId]!;
	assertFunctionMemoryIoAllowed(line, context);
	const dereference = buildPointerDereferenceByteCode(local, localGet(local.index), 'pointer-value');

	return saveByteCode(context, dereference.byteCode);
}
