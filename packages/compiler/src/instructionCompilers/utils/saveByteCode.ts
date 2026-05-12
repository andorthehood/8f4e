import type { CompilationContext } from '@8f4e/compiler-spec';

export function saveByteCode(context: CompilationContext, byteCode: number[]): CompilationContext {
	context.byteCode.push(...byteCode);
	return context;
}
