import type { CodegenContext } from '@8f4e/compiler-spec';

/**
 * Appends one bytecode fragment to the active code generation context.
 *
 * @param context - Compilation context used by the operation.
 * @param byteCode - Instruction bytes to append to the current output.
 * @returns The computed result.
 */
export function saveByteCode(context: CodegenContext, byteCode: number[]): CodegenContext {
	context.byteCode.push(...byteCode);
	return context;
}
