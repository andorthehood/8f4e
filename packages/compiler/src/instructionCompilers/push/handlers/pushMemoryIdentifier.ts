import { i32const } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../../../utils/compilation';
import { getDataStructure } from '../../../utils/memoryData';
import { kindToStackItem, loadOpcode, resolveMemoryValueKind } from '../shared';

import type { CompilationContext, PushIdentifierLine } from '@8f4e/compiler-types';

export default function pushMemoryIdentifier(
	line: PushIdentifierLine,
	context: CompilationContext
): CompilationContext {
	const memory = context.namespace.memory;
	const memoryItem = getDataStructure(memory, line.arguments[0].value)!;

	const kind = resolveMemoryValueKind(memoryItem);
	context.stack.push(kindToStackItem(kind, { isNonZero: false }));

	return saveByteCode(context, [...i32const(memoryItem.byteAddress), ...loadOpcode[kind]()]);
}
