// Lazy loading modules - all modules are now loaded through the registry
// This file is kept for backwards compatibility but now uses the registry system
import { type ModulesType } from '../registry';

// Export a proxy that loads modules lazily when accessed
const modules: ModulesType = new Proxy({} as ModulesType, {
	get(target, prop: string) {
		if (typeof prop === 'string') {
			// If we already have a cached value, return it
			if (target[prop] !== undefined) {
				return target[prop];
			}

			// For now, return undefined to maintain existing behavior
			// The actual loading will happen through the registry functions
			return undefined;
		}
		return undefined;
	},
});

export default modules;
