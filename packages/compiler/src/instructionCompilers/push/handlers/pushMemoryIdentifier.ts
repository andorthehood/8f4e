import { i32const } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../../utils/saveByteCode';
import { getDataStructure } from '../../../utils/memoryData';
import { loadOpcode, resolveMemoryValueKind } from '../shared';

import type { CodegenContext, PushIdentifierLine } from '@8f4e/compiler-spec';

export default function pushMemoryIdentifier(line: PushIdentifierLine, context: CodegenContext): CodegenContext {
	const memory = context.namespace.memory;
	const memoryItem = getDataStructure(memory, line.arguments[0].value)!;

	const kind = resolveMemoryValueKind(memoryItem);

	return saveByteCode(context, [...i32const(memoryItem.byteAddress), ...loadOpcode[kind](memoryItem.memoryIndex)]);
}
