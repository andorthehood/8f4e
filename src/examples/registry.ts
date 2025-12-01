import { moduleManifest, moduleMetadata } from './modules/index';
import { projectManifest, projectMetadata } from './projects/index';

import type { ExampleModule, ModuleMetadata, Project, ProjectMetadata } from '@8f4e/editor-state';

// Re-export manifests for external use
export { projectManifest };

// Cache for loaded modules to avoid redundant loading
const loadedModulesCache: Record<string, ExampleModule> = {};

// Cache for loaded projects to avoid redundant loading
const loadedProjectsCache: Record<string, Project> = {};

/**
 * Get list of modules with metadata only.
 * Returns hardcoded metadata without loading any module code.
 */
export async function getListOfModules(): Promise<ModuleMetadata[]> {
	return moduleMetadata;
}

/**
 * Get a specific module by slug.
 * Uses cached version if available, otherwise loads on-demand.
 */
export async function getModule(slug: string): Promise<ExampleModule> {
	// Check cache first
	if (loadedModulesCache[slug]) {
		console.log(`Module ${slug} loaded from cache`);
		return loadedModulesCache[slug];
	}

	// Load from manifest
	const loader = moduleManifest[slug];
	if (!loader) {
		throw new Error(`Module not found: ${slug}`);
	}

	console.log(`Loading module: ${slug}`);
	const module = await loader();
	loadedModulesCache[slug] = module;
	console.log(`Loaded module: ${module.title}`);

	return module;
}

/**
 * @deprecated Use getListOfModules and getModule instead.
 * This function is kept for backwards compatibility but now loads modules lazily.
 */
export async function loadAllModules(): Promise<Record<string, ExampleModule>> {
	console.log('Loading all modules (lazy)...');

	// Ensure all modules are loaded
	await getListOfModules();

	// Return the cache which now contains all modules
	return { ...loadedModulesCache };
}

/**
 * Get list of projects with metadata only.
 * Returns hardcoded metadata without loading any project code.
 */
export async function getListOfProjects(): Promise<ProjectMetadata[]> {
	return projectMetadata;
}

/**
 * Get specific project by slug.
 * Uses cached version if available, otherwise loads on-demand.
 */
export async function getProject(slug: string): Promise<Project> {
	// Check cache first
	if (loadedProjectsCache[slug]) {
		console.log(`Project ${slug} loaded from cache`);
		return loadedProjectsCache[slug];
	}

	// Load from manifest
	const loader = projectManifest[slug];
	if (!loader) {
		throw new Error(`Project not found: ${slug}`);
	}

	console.log(`Loading project: ${slug}`);
	const project = await loader();
	loadedProjectsCache[slug] = project;
	console.log(`Loaded project: ${slug}`);

	return project;
}

// Type definitions for backwards compatibility
export type ModulesType = Record<string, ExampleModule> & { [key: string]: ExampleModule | undefined };
export type ProjectsType = Record<string, Project> & { [key: string]: Project | undefined };
