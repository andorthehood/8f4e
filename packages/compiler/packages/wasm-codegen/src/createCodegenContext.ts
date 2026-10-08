import type { CodegenContext, CompilationContext, LocalStorageMap, SourceLocalBinding } from '@8f4e/language-spec';
import { createCompilationContext } from '@8f4e/semantic-utils';
import { allocateLocalFromType } from './localStorage';

export function createCodegenContext<TContext extends CodegenContext>(
	overrides: Partial<CompilationContext>,
	bindings: readonly SourceLocalBinding[]
): TContext {
	const { stack: _stack, ...context } = createCompilationContext<
		CompilationContext & { locals: LocalStorageMap; nextLocalIndex: number }
	>({
		...overrides,
		locals: {},
		nextLocalIndex: 0,
	});
	for (const binding of bindings) allocateLocalFromType(context, String(binding.id), binding.type);
	return context as TContext;
}
