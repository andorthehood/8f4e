import { extractUseDependencies } from '@8f4e/tokenizer';
import type { ExampleModuleRegistryEntry } from './exampleModules';
import { getExampleModuleLoader, getExampleModuleRegistry } from './exampleModules';

// Cache for loaded modules to avoid redundant loading
const loadedModulesCache = new Map<string, string>();
const moduleDependencyCache = new Map<string, string[]>();

/**
 * Get list of modules with metadata only.
 * Returns the bundled catalog without loading any module code.
 */
export async function getListOfModules(): Promise<ExampleModuleRegistryEntry[]> {
	return getExampleModuleRegistry();
}

function inferModuleDependenciesFromCode(slug: string, code: string): string[] {
	const dependencies = extractUseDependencies(code);

	return dependencies.filter(dependency => dependency !== slug && getExampleModuleLoader(dependency) !== undefined);
}

export async function getModuleDependencies(slug: string): Promise<string[]> {
	const cachedDependencies = moduleDependencyCache.get(slug);
	if (cachedDependencies) {
		return cachedDependencies;
	}

	const code = await getModule(slug);
	const dependencies = inferModuleDependenciesFromCode(slug, code);
	moduleDependencyCache.set(slug, dependencies);
	return dependencies;
}

/**
 * Get a specific module by slug.
 * Uses cached source if available, otherwise imports its lazy chunk.
 */
export async function getModule(slug: string): Promise<string> {
	const cachedModule = loadedModulesCache.get(slug);
	if (cachedModule !== undefined) {
		return cachedModule;
	}

	const load = getExampleModuleLoader(slug);
	if (!load) {
		throw new Error(`Module not found: ${slug}`);
	}

	const module = await load();
	loadedModulesCache.set(slug, module);

	return module;
}
