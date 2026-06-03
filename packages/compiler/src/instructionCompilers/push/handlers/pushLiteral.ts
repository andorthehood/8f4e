import type { CodegenContext, NormalizedArgumentLiteral } from '@8f4e/compiler-spec';
import { saveByteCode } from '../../utils/saveByteCode';
import { constOpcode, resolveArgumentValueKind } from '../shared';

/**
 * Emits bytecode for pushing a numeric literal onto the stack.
 *
 * @param argument - Argument whose resolved value or metadata should be used.
 * @param context - Current compiler context consulted or updated by the operation.
 * @returns The result of the operation.
 */
export default function pushLiteral(argument: NormalizedArgumentLiteral, context: CodegenContext): CodegenContext {
	const kind = resolveArgumentValueKind(argument);
	return saveByteCode(context, constOpcode[kind](argument.value));
}
