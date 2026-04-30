import { extractUseDependencies } from '@8f4e/tokenizer';

import { getExampleModuleManifest, getExampleModuleMetadata } from './exampleModules';

import type { ModuleMetadata } from '@8f4e/editor-state-types';

// Cache for loaded modules to avoid redundant loading
const loadedModulesCache: Record<string, string> = {};
const moduleDependencyCache: Record<string, string[]> = {};

/**
 * Get list of modules with metadata only.
 * Returns hosted registry metadata without loading any module code.
 */
export async function getListOfModules(): Promise<ModuleMetadata[]> {
	return getExampleModuleMetadata();
}

async function inferModuleDependenciesFromCode(slug: string, code: string): Promise<string[]> {
	const moduleManifest = await getExampleModuleManifest();
	const validSlugs = new Set(Object.keys(moduleManifest));
	const dependencies = extractUseDependencies(code);

	return dependencies.filter(dependency => dependency !== slug && validSlugs.has(dependency));
}

export async function getModuleDependencies(slug: string): Promise<string[]> {
	if (moduleDependencyCache[slug]) {
		return moduleDependencyCache[slug];
	}

	const code = await getModule(slug);
	const dependencies = await inferModuleDependenciesFromCode(slug, code);
	moduleDependencyCache[slug] = dependencies;
	return dependencies;
}

/**
 * Get a specific module by slug.
 * Uses cached version if available, otherwise fetches on-demand.
 */
export async function getModule(slug: string): Promise<string> {
	if (loadedModulesCache[slug]) {
		console.log(`Module ${slug} loaded from cache`);
		return loadedModulesCache[slug];
	}

	const moduleManifest = await getExampleModuleManifest();
	const url = moduleManifest[slug];
	if (!url) {
		throw new Error(`Module not found: ${slug}`);
	}

	console.log(`Loading module: ${url}`);
	const requestUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
	const response = await fetch(requestUrl, { cache: 'no-store' });
	if (!response.ok) {
		throw new Error(`Failed to fetch module from ${requestUrl}: HTTP ${response.status}`);
	}
	const module = await response.text();
	loadedModulesCache[slug] = module;
	console.log(`Loaded module: ${slug}`);

	return module;
}
