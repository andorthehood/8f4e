import type { PublicMemoryLayoutContext } from '../internalTypes';

export function getTargetModuleNamespace(context: PublicMemoryLayoutContext, targetModuleId: string) {
	return context.namespace.modules?.[targetModuleId];
}
