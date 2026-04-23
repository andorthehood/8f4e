import { i32const } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from '../../assertFunctionMemoryIoAllowed';
import { saveByteCode } from '../../../utils/compilation';
import { getDataStructure } from '../../../utils/memoryData';
import { buildPointerDereferenceByteCode, kindToStackItem } from '../shared';

import type { CompilationContext, PushIdentifierLine } from '../../../types';

export default function pushMemoryPointer(line: PushIdentifierLine, context: CompilationContext): CompilationContext {
	const memory = context.namespace.memory;
	const argument = line.arguments[0];
	if (argument.referenceKind !== 'memory-pointer') {
		return context;
	}
	const base = argument.targetMemoryId;
	const memoryItem = getDataStructure(memory, base)!;
	assertFunctionMemoryIoAllowed(line, context);
	const dereference = buildPointerDereferenceByteCode(memoryItem, i32const(memoryItem.byteAddress), 'pointer-slot');
	context.stack.push(kindToStackItem(dereference.kind, { isNonZero: false }));

	return saveByteCode(context, dereference.byteCode);
}
