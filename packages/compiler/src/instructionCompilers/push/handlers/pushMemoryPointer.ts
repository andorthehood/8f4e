import { i32const } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from '../../assertFunctionMemoryIoAllowed';
import { saveByteCode } from '../../utils/saveByteCode';
import { getDataStructure } from '../../../utils/memoryData';
import { buildPointerDereferenceByteCode } from '../shared';

import type { CodegenContext, PushIdentifierLine } from '@8f4e/compiler-spec';

type MemoryPointerArgument = Extract<PushIdentifierLine['arguments'][number], { referenceKind: 'memory-pointer' }>;

export default function pushMemoryPointer(line: PushIdentifierLine, context: CodegenContext): CodegenContext {
	const memory = context.namespace.memory;
	const argument = line.arguments[0] as MemoryPointerArgument;
	const base = argument.targetMemoryId;
	const memoryItem = getDataStructure(memory, base)!;
	assertFunctionMemoryIoAllowed(line, context);
	const dereference = buildPointerDereferenceByteCode(memoryItem, i32const(memoryItem.byteAddress), 'pointer-slot');

	return saveByteCode(context, dereference.byteCode);
}
