import type { PublicMemoryLayoutContext } from '../types';

export function getTargetModuleNamespace(context: PublicMemoryLayoutContext, targetModuleId: string) {
	const targetNamespace = context.namespace.namespaces[targetModuleId];
	return targetNamespace?.kind === 'module' ? targetNamespace : undefined;
}
