import initEditor, { type RuntimeFactory, type RuntimeType } from '@8f4e/editor';

import { getListOfModules, getModule, getListOfProjects, getProject } from './examples/registry';
import { audioWorkletRuntime } from './audio-worklet-runtime-factory';
import { webWorkerLogicRuntime } from './web-worker-logic-runtime-factory';
import { webWorkerMIDIRuntime } from './web-worker-midi-runtime-factory';
import {
	loadProjectFromStorage,
	saveProjectToStorage,
	loadEditorSettingsFromStorage,
	saveEditorSettingsToStorage,
	loadProjectFromFile,
	saveProjectToFile,
	importBinaryAsset,
} from './storage-callbacks';
import { compileProject } from './compiler-callback';

const runtimeFactories: Record<RuntimeType, RuntimeFactory> = {
	AudioWorkletRuntime: audioWorkletRuntime,
	WebWorkerLogicRuntime: webWorkerLogicRuntime,
	WebWorkerMIDIRuntime: webWorkerMIDIRuntime,
};

async function requestRuntime(runtimeType: RuntimeType): Promise<RuntimeFactory> {
	const factory = runtimeFactories[runtimeType];
	if (!factory) {
		throw new Error(`Unknown runtime type: ${runtimeType}`);
	}

	console.log(`[App] Providing runtime factory for: ${runtimeType}`);
	return factory;
}

async function init() {
	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	const editor = await initEditor(canvas, {
		featureFlags: {
			persistentStorage: true,
			infoOverlay: true,
		},
		getListOfModules,
		getModule,
		getListOfProjects,
		getProject,
		requestRuntime,
		compileProject,
		loadProjectFromStorage,
		saveProjectToStorage,
		loadEditorSettingsFromStorage,
		saveEditorSettingsToStorage,
		loadProjectFromFile,
		saveProjectToFile,
		importBinaryAsset,
	});

	// @ts-expect-error - Expose state for debugging purposes
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
