import type { CompilationContext, FunctionValueType, LocalBinding } from '@8f4e/language-spec';
import { functionValueTypeToLocalBinding } from '@8f4e/language-spec';

type LocalAllocationContext = Pick<CompilationContext, 'locals' | 'nextLocalIndex'>;
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type LocalBindingMetadata = DistributiveOmit<LocalBinding, 'index'>;

function registerLocal(context: LocalAllocationContext, name: string, local: LocalBinding): LocalBinding {
	context.locals[name] = local;
	context.nextLocalIndex += 1;
	return local;
}

/** Allocates and registers one named local binding at the next available index. */
export function allocateLocal(
	context: LocalAllocationContext,
	name: string,
	binding: LocalBindingMetadata
): LocalBinding {
	return registerLocal(context, name, { ...binding, index: context.nextLocalIndex } as LocalBinding);
}

/** Allocates a local binding from a source-language function value type. */
export function allocateLocalFromType(
	context: LocalAllocationContext,
	name: string,
	type: FunctionValueType
): LocalBinding {
	return registerLocal(context, name, functionValueTypeToLocalBinding(type, context.nextLocalIndex));
}

/** Returns an existing named local binding or allocates it when absent. */
export function getOrCreateLocal(
	context: LocalAllocationContext,
	name: string,
	binding: LocalBindingMetadata
): LocalBinding {
	return context.locals[name] ?? allocateLocal(context, name, binding);
}

/** Clears all local bindings and restarts index allocation at zero. */
export function resetLocals(context: LocalAllocationContext): void {
	context.locals = {};
	context.nextLocalIndex = 0;
}
