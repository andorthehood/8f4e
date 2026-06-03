import type { CodegenContext } from '@8f4e/compiler-spec';

/** Appends one bytecode fragment to the active code generation context. */
export function saveByteCode(context: CodegenContext, byteCode: number[]): CodegenContext {
	context.byteCode.push(...byteCode);
	return context;
}
