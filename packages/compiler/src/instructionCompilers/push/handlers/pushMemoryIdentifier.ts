import type { CodegenContext, ResolvedMemoryPushLine } from '@8f4e/compiler-spec';
import { i32const } from '@8f4e/compiler-wasm-utils';
import { saveByteCode } from '../../utils/saveByteCode';
import { loadOpcode, resolveMemoryValueKind } from '../shared';

/** Emits bytecode for pushing a resolved memory value by identifier. */
export default function pushMemoryIdentifier(line: ResolvedMemoryPushLine, context: CodegenContext): CodegenContext {
	const { memoryItem } = line.resolvedTarget;
	const kind = resolveMemoryValueKind(memoryItem);

	return saveByteCode(context, [...i32const(memoryItem.byteAddress), ...loadOpcode[kind](memoryItem.memoryIndex)]);
}
