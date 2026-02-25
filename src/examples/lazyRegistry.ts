import { getModuleRegistry } from './lazyModuleRegistry';
import { getProjectRegistry } from './lazyProjectRegistry';

let registryPromise: Promise<typeof import('./registry')> | null = null;

export function getRegistry() {
	if (!registryPromise) {
		registryPromise = Promise.all([getModuleRegistry(), getProjectRegistry()])
			.then(([moduleRegistry, projectRegistry]) => ({
				...moduleRegistry,
				...projectRegistry,
			}))
			.catch(error => {
				registryPromise = null;
				throw error;
			}) as Promise<typeof import('./registry')>;
	}
	return registryPromise;
}
