import { extractUseDependencies } from '@8f4e/compiler/syntax';

import { moduleManifest, moduleMetadata } from './exampleModules';
import { projectMetadata } from './exampleProjects';

import type { ModuleMetadata, ProjectMetadata } from '@8f4e/editor-state';

// Cache for loaded modules to avoid redundant loading
const loadedModulesCache: Record<string, string> = {};
const moduleDependencyCache: Record<string, string[]> = {};

/**
 * Get list of modules with metadata only.
 * Returns hardcoded metadata without loading any module code.
 */
export async function getListOfModules(): Promise<ModuleMetadata[]> {
	return moduleMetadata;
}

function inferModuleDependenciesFromCode(slug: string, code: string): string[] {
	const validSlugs = new Set(Object.keys(moduleManifest));
	const dependencies = extractUseDependencies(code);

	return dependencies.filter(dependency => dependency !== slug && validSlugs.has(dependency));
}

export async function getModuleDependencies(slug: string): Promise<string[]> {
	if (moduleDependencyCache[slug]) {
		return moduleDependencyCache[slug];
	}

	const code = await getModule(slug);
	const dependencies = inferModuleDependenciesFromCode(slug, code);
	moduleDependencyCache[slug] = dependencies;
	return dependencies;
}

/**
 * Get a specific module by slug.
 * Uses cached version if available, otherwise loads on-demand.
 */
export async function getModule(slug: string): Promise<string> {
	if (loadedModulesCache[slug]) {
		console.log(`Module ${slug} loaded from cache`);
		return loadedModulesCache[slug];
	}

	const loader = moduleManifest[slug];
	if (!loader) {
		throw new Error(`Module not found: ${slug}`);
	}

	console.log(`Loading module: ${slug}`);
	const module = await loader();
	loadedModulesCache[slug] = module;
	console.log(`Loaded module: ${slug}`);

	return module;
}

/**
 * Get list of projects with metadata only.
 * Returns hardcoded metadata without loading any project code.
 */
export async function getListOfProjects(): Promise<ProjectMetadata[]> {
	return projectMetadata;
}

export function getDefaultProjectUrl(): string | null {
	return projectMetadata.length > 0 ? projectMetadata[0].url : null;
}

/**
 * Get specific project by URL with forced cache bypass.
 */
export async function getProject(url: string): Promise<string> {
	console.log(`Loading project: ${url}`);
	const requestUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
	const response = await fetch(requestUrl, { cache: 'no-store' });
	if (!response.ok) {
		throw new Error(`Failed to fetch project from ${requestUrl}: HTTP ${response.status}`);
	}
	const text = await response.text();
	console.log(`Loaded project: ${url}`);

	return text;
}

// Type definitions for backwards compatibility
export type ModulesType = Record<string, string> & { [key: string]: string | undefined };
