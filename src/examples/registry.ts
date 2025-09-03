import type { ExampleModule, ModuleMetadata, Project, ProjectMetadata } from '../../packages/editor/src/state/types';

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

// Loading state management for modules
let modulesLoaded = false;
let loadedModules: Record<string, ExampleModule> = {};

// Single lazy import for all modules - load on demand
export async function loadAllModules(): Promise<Record<string, ExampleModule>> {
	if (modulesLoaded) {
		return loadedModules;
	}

	console.log('Loading all modules in batch...');

	// Single lazy import loads all modules at once
	const modulesImport = await import('./modules/index');
	loadedModules = modulesImport.default;
	modulesLoaded = true;

	console.log(`Loaded ${Object.keys(loadedModules).length} modules`);
	return loadedModules;
}

// Get list of modules (loads all modules and derives metadata from them)
export async function getListOfModules(): Promise<ModuleMetadata[]> {
	const modules = await loadAllModules();
	return Object.entries(modules).map(([slug, module]) => ({
		slug,
		title: module.title,
		category: module.category,
	}));
}

// Get specific module (loads all modules if not loaded yet)
export async function getModule(slug: string): Promise<ExampleModule> {
	const modules = await loadAllModules();
	const module = modules[slug];
	if (!module) {
		throw new Error(`Module not found: ${slug}`);
	}
	return module;
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
