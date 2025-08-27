// Lazy loading projects - each project is now loaded individually through the registry
// This file is kept for backwards compatibility but now uses the registry system
import { type ProjectsType } from '../registry';

// Export a proxy that loads projects lazily when accessed
const projects: ProjectsType = new Proxy({} as ProjectsType, {
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

export default projects;
