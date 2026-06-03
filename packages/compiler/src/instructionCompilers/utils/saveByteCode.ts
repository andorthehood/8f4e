import type { CodegenContext } from '@8f4e/compiler-spec';

/**
 * Appends one bytecode fragment to the active code generation context.
 *
 * @param context - Current compiler context consulted or updated by the operation.
 * @param byteCode - Instruction bytes to append to the current output.
 * @returns The result of the operation.
 */
export function saveByteCode(context: CodegenContext, byteCode: number[]): CodegenContext {
	context.byteCode.push(...byteCode);
	return context;
}
