import { moduleManifest, moduleMetadata } from './exampleModules';
import { projectMetadata } from './exampleProjects';

import type { ModuleMetadata, ProjectMetadata } from '@8f4e/editor-state';

// Cache for loaded modules to avoid redundant loading
const loadedModulesCache: Record<string, string> = {};

// Cache for loaded projects to avoid redundant loading
const loadedProjectsCache: Record<string, string> = {};

/**
 * Get list of modules with metadata only.
 * Returns hardcoded metadata without loading any module code.
 */
export async function getListOfModules(): Promise<ModuleMetadata[]> {
	return moduleMetadata;
}

export function getModuleDependencies(slug: string): string[] {
	const metadata = moduleMetadata.find(module => module.slug === slug);
	return metadata?.dependencies ?? [];
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
 * Get specific project by URL.
 * Uses cached version if available, otherwise loads on-demand.
 */
export async function getProject(url: string): Promise<string> {
	if (loadedProjectsCache[url]) {
		console.log(`Project ${url} loaded from cache`);
		return loadedProjectsCache[url];
	}

	console.log(`Loading project: ${url}`);
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch project from ${url}: HTTP ${response.status}`);
	}
	const text = await response.text();
	loadedProjectsCache[url] = text;
	console.log(`Loaded project: ${url}`);

	return text;
}

// Type definitions for backwards compatibility
export type ModulesType = Record<string, string> & { [key: string]: string | undefined };
