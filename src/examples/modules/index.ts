import { loadAllModules, getAllModuleMetadata } from '../registry';

// Create a wrapper that provides synchronous metadata access for menus
// while lazy loading the actual module content (code) when needed
function createLazyModuleWrappers() {
	const metadata = getAllModuleMetadata();
	const moduleWrappers: Record<string, unknown> = {};

	for (const [key, meta] of Object.entries(metadata)) {
		moduleWrappers[key] = {
			title: meta.title,
			author: meta.author,
			category: meta.category,
			tests: [], // Static empty array for consistency
			// Lazy loading getter for code
			get code() {
				// Return a promise that resolves to the code when accessed
				return loadAllModules().then(modules => modules[key].code);
			},
		};
	}

	return moduleWrappers;
}

// Export the lazy module wrappers
const modules = createLazyModuleWrappers();

export default modules;
