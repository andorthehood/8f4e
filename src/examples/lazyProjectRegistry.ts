let projectRegistryPromise: Promise<typeof import('./projectRegistry')> | null = null;

export function getProjectRegistry() {
	if (!projectRegistryPromise) {
		projectRegistryPromise = import('./projectRegistry').catch(error => {
			projectRegistryPromise = null;
			throw error;
		});
	}
	return projectRegistryPromise;
}
