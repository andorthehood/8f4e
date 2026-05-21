import type { CodegenContext } from '@8f4e/compiler-spec';

export function saveByteCode(context: CodegenContext, byteCode: number[]): CodegenContext {
	context.byteCode.push(...byteCode);
	return context;
}
