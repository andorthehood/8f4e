import initEditor, { type Project, type RuntimeFactory, type RuntimeType } from '@8f4e/editor';

import projects from './examples/projects';
import modules from './examples/modules';
// Import the runtime factory functions from separate dedicated files
import { audioWorkletRuntime } from './audio-worklet-runtime-factory';
import { webWorkerLogicRuntime } from './web-worker-logic-runtime-factory';
import { webWorkerMIDIRuntime } from './web-worker-midi-runtime-factory';

// Runtime factory registry - this demonstrates how consumers can implement the requestRuntime callback
const runtimeFactories: Record<RuntimeType, RuntimeFactory> = {
	AudioWorkletRuntime: audioWorkletRuntime,
	WebWorkerLogicRuntime: webWorkerLogicRuntime,
	WebWorkerMIDIRuntime: webWorkerMIDIRuntime,
};

// Implementation of async callback functions for modules and projects
async function getListOfModules() {
	return Object.entries(modules).map(([slug, module]) => ({
		slug,
		title: module.title,
		category: module.category,
	}));
}

async function getModule(slug: string) {
	const module = modules[slug];
	if (!module) {
		throw new Error(`Module not found: ${slug}`);
	}
	return module;
}

async function getListOfProjects() {
	return Object.entries(projects).map(([slug, project]) => ({
		slug,
		title: project.title,
		description: project.description,
	}));
}

async function getProject(slug: string) {
	const project = projects[slug];
	if (!project) {
		throw new Error(`Project not found: ${slug}`);
	}
	return project;
}

// Implementation of the requestRuntime callback
async function requestRuntime(runtimeType: RuntimeType): Promise<RuntimeFactory> {
	const factory = runtimeFactories[runtimeType];
	if (!factory) {
		throw new Error(`Unknown runtime type: ${runtimeType}`);
	}

	console.log(`[App] Providing runtime factory for: ${runtimeType}`);
	return factory;
}

const kebabCaseToCamelCase = (str: string) =>
	str.replace(/-([a-z])/g, function (g) {
		return g[1].toUpperCase();
	});

async function init() {
	const projectName = kebabCaseToCamelCase(location.hash.match(/#\/([a-z-]*)/)?.[1] || '');
	const project: Project = projects[projectName] || projects.audioBuffer;

	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	const editor = await initEditor(canvas, project, {
		featureFlags: {
			localStorage: true,
			infoOverlay: true,
		},
		localStorageId: 'editor',
		getListOfModules,
		getModule,
		getListOfProjects,
		getProject,
		requestRuntime, // Add the runtime callback
	});

	// @ts-ignore
	window.state = editor.state;

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	editor.resize(window.innerWidth, window.innerHeight);

	window.addEventListener('resize', () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		editor.resize(window.innerWidth, window.innerHeight);
	});
}

if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener('DOMContentLoaded', init);
}
