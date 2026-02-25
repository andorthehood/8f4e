let registryPromise: Promise<typeof import('./registry')> | null = null;

export function getRegistry() {
	if (!registryPromise) {
		registryPromise = import('./registry').catch(error => {
			registryPromise = null;
			throw error;
		});
	}
	return registryPromise;
}
