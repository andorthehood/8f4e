import type { PublicMemoryLayoutContext } from '../internalTypes';

export function hasResolvedModuleLayouts(context: PublicMemoryLayoutContext): boolean {
	return Object.keys(context.namespace.modules ?? {}).length > 0;
}
