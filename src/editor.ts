import initEditor, { type Project, type RuntimeFactory, type RuntimeType } from '@8f4e/editor';

import exampleProjects from './examples/projects';
import exampleModules from './examples/modules';
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
	const project: Project = exampleProjects[projectName] || exampleProjects.audioBuffer;

	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	const editor = await initEditor(canvas, project, {
		featureFlags: {
			localStorage: true,
			infoOverlay: true,
		},
		localStorageId: 'editor',
		exampleProjects,
		exampleModules,
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
