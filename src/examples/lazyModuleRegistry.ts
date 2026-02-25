let moduleRegistryPromise: Promise<typeof import('./moduleRegistry')> | null = null;

export function getModuleRegistry() {
	if (!moduleRegistryPromise) {
		moduleRegistryPromise = import('./moduleRegistry').catch(error => {
			moduleRegistryPromise = null;
			throw error;
		});
	}
	return moduleRegistryPromise;
}
