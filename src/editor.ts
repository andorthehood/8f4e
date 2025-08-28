import initEditor from '@8f4e/editor';

import { getListOfModules, getModule, getListOfProjects, getProject } from './examples/registry';
import { requestRuntime } from './runtime-loader';
import {
	loadProjectFromStorage,
	saveProjectToStorage,
	loadEditorSettingsFromStorage,
	saveEditorSettingsToStorage,
	loadProjectFromFile,
	exportFile,
	importBinaryAsset,
} from './storage-callbacks';
import { compileProject } from './compiler-callback';

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
		exportFile,
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
