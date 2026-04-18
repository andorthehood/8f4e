import type { PublicMemoryLayoutContext } from '../types';

export function hasCollectedNamespaces(context: PublicMemoryLayoutContext): boolean {
	return Object.keys(context.namespace.namespaces).length > 0;
}
