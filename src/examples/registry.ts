import { moduleManifest } from './modules/index';

import type { ExampleModule, ModuleMetadata, Project, ProjectMetadata } from '@8f4e/editor-state';

// Project registry with lazy loading functions (individual loading strategy for projects)
interface ProjectRegistryEntry {
	metadata: ProjectMetadata;
	loader: () => Promise<Project>;
}

export const projectRegistry: Record<string, ProjectRegistryEntry> = {
	audioBuffer: {
		metadata: { slug: 'audioBuffer', title: 'Audio Buffer', description: '' },
		loader: () => import('./projects/audioBuffer').then(m => m.default),
	},
	bistableMultivibrators: {
		metadata: { slug: 'bistableMultivibrators', title: 'Bistable Multivibrators', description: '' },
		loader: () => import('./projects/bistableMultivibrators').then(m => m.default),
	},
	crtEffect: {
		metadata: {
			slug: 'crtEffect',
			title: 'CRT Effect Demo',
			description: 'Demonstrates post-process shader effects with a classic CRT monitor appearance',
		},
		loader: () => import('./projects/crtEffect').then(m => m.default),
	},
	midiBreakBeat: {
		metadata: { slug: 'midiBreakBeat', title: 'MIDI Break Beat', description: '' },
		loader: () => import('./projects/midiBreakBeat').then(m => m.default),
	},
	midiBreakBreak2dSequencer: {
		metadata: { slug: 'midiBreakBreak2dSequencer', title: 'MIDI Break Break 2D Sequencer', description: '' },
		loader: () => import('./projects/midiBreakBreak2dSequencer').then(m => m.default),
	},
	dancingWithTheSineLT: {
		metadata: { slug: 'dancingWithTheSineLT', title: 'Dancing With The Sine LT', description: '' },
		loader: () => import('./projects/dancingWithTheSineLT').then(m => m.default),
	},
	randomGenerators: {
		metadata: { slug: 'randomGenerators', title: 'Random Generators', description: '' },
		loader: () => import('./projects/randomGenerators').then(m => m.default),
	},
	randomNoteGenerator: {
		metadata: { slug: 'randomNoteGenerator', title: 'Random Note Generator', description: '' },
		loader: () => import('./projects/randomNoteGenerator').then(m => m.default),
	},
	midiArpeggiator: {
		metadata: { slug: 'midiArpeggiator', title: 'MIDI Arpeggiator', description: '' },
		loader: () => import('./projects/midiArpeggiator').then(m => m.default),
	},
	midiArpeggiator2: {
		metadata: { slug: 'midiArpeggiator2', title: 'MIDI Arpeggiator 2', description: '' },
		loader: () => import('./projects/midiArpeggiator2').then(m => m.default),
	},
	ericSaiteGenerator: {
		metadata: { slug: 'ericSaiteGenerator', title: 'Eric Saite Generator', description: '' },
		loader: () => import('./projects/ericSaiteGenerator').then(m => m.default),
	},
	neuralNetwork: {
		metadata: { slug: 'neuralNetwork', title: 'Neural Network', description: '' },
		loader: () => import('./projects/neuralNetwork').then(m => m.default),
	},
	audioLoopback: {
		metadata: { slug: 'audioLoopback', title: 'Audio Loopback', description: '' },
		loader: () => import('./projects/audioLoopback').then(m => m.default),
	},
	simpleCounterMainThread: {
		metadata: {
			slug: 'simpleCounterMainThread',
			title: 'Simple Counter (Main Thread)',
			description: 'Demonstrates the MainThreadLogicRuntime',
		},
		loader: () => import('./projects/simpleCounterMainThread').then(m => m.default),
	},
};

// Cache for loaded modules to avoid redundant loading
const loadedModulesCache: Record<string, ExampleModule> = {};
let metadataCache: ModuleMetadata[] | null = null;

/**
 * Get list of modules with metadata only.
 * This loads all modules once to extract metadata, then caches the result.
 * Individual modules are loaded on-demand when getModule is called.
 */
export async function getListOfModules(): Promise<ModuleMetadata[]> {
	if (metadataCache) {
		return metadataCache;
	}

	console.log('Loading module metadata...');

	// Load all modules to extract metadata
	// This is necessary because metadata is embedded in the module objects
	const metadataPromises = Object.entries(moduleManifest).map(async ([slug, loader]) => {
		const module = await loader();
		// Cache the loaded module for future use
		loadedModulesCache[slug] = module;
		return {
			slug,
			title: module.title,
			category: module.category,
		};
	});

	metadataCache = await Promise.all(metadataPromises);
	console.log(`Loaded metadata for ${metadataCache.length} modules`);

	return metadataCache;
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

// Get list of projects (metadata only)
export async function getListOfProjects(): Promise<ProjectMetadata[]> {
	return Object.values(projectRegistry).map(entry => entry.metadata);
}

// Get specific project (loads individual project on demand)
export async function getProject(slug: string): Promise<Project> {
	const entry = projectRegistry[slug];
	if (!entry) {
		throw new Error(`Project not found: ${slug}`);
	}

	console.log(`Loading project: ${slug}`);
	const project = await entry.loader();
	console.log(`Loaded project: ${project.title}`);
	return project;
}

// Type definitions for backwards compatibility
export type ModulesType = Record<string, ExampleModule> & { [key: string]: ExampleModule | undefined };
export type ProjectsType = Record<string, Project> & { [key: string]: Project | undefined };
