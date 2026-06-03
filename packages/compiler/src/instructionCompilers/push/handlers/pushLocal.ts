import type { CodegenContext, ResolvedLocalPushLine } from '@8f4e/compiler-spec';
import { localGet } from '@8f4e/compiler-wasm-utils';
import { saveByteCode } from '../../utils/saveByteCode';

/**
 * Emits bytecode for pushing a local value onto the stack.
 *
 * @param line - Compiler line being processed.
 * @param context - Current compiler context consulted or updated by the operation.
 * @returns The result of the operation.
 */
export default function pushLocal(line: ResolvedLocalPushLine, context: CodegenContext): CodegenContext {
	const { local } = line.resolvedTarget;

	return saveByteCode(context, localGet(local.index));
}
