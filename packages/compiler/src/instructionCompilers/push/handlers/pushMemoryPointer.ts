import { i32const, i32load, i32load16s, i32load8s } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../../../utils/compilation';
import { getDataStructure } from '../../../utils/memoryData';
import { kindToStackItem, loadOpcode, resolvePointerTargetValueKind } from '../shared';

import type { CompilationContext, PushIdentifierLine } from '../../../types';

export default function pushMemoryPointer(line: PushIdentifierLine, context: CompilationContext): CompilationContext {
	const memory = context.namespace.memory;
	const argument = line.arguments[0];
	if (argument.referenceKind !== 'memory-pointer') {
		return context;
	}
	const base = argument.targetMemoryId;
	const memoryItem = getDataStructure(memory, base)!;

	const kind = resolvePointerTargetValueKind(memoryItem);
	context.stack.push(kindToStackItem(kind, { isNonZero: false }));

	// For int8* and int8**, use i32load8s (sign-extended 8-bit load) for the final dereference.
	// For int16* and int16**, use i32load16s (sign-extended 16-bit load) for the final dereference.
	const finalLoad =
		memoryItem.pointeeBaseType === 'int8'
			? i32load8s()
			: memoryItem.pointeeBaseType === 'int16'
				? i32load16s()
				: loadOpcode[kind]();

	return saveByteCode(context, [
		...i32const(memoryItem.byteAddress),
		...(memoryItem.isPointingToPointer ? [...i32load(), ...i32load()] : i32load()),
		...finalLoad,
	]);
}
