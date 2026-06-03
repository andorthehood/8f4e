import type { CodegenContext, ResolvedMemoryPushLine } from '@8f4e/compiler-spec';
import { i32const } from '@8f4e/compiler-wasm-utils';
import { saveByteCode } from '../../utils/saveByteCode';
import { loadOpcode, resolveMemoryValueKind } from '../shared';

/**
 * Emits bytecode for pushing a resolved memory value by identifier.
 *
 * @param line - Compiler line being processed.
 * @param context - Current compiler context consulted or updated by the operation.
 * @returns The result of the operation.
 */
export default function pushMemoryIdentifier(line: ResolvedMemoryPushLine, context: CodegenContext): CodegenContext {
	const { memoryItem } = line.resolvedTarget;
	const kind = resolveMemoryValueKind(memoryItem);

	return saveByteCode(context, [...i32const(memoryItem.byteAddress), ...loadOpcode[kind](memoryItem.memoryIndex)]);
}
