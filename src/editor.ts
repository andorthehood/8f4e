import initEditor from '@8f4e/editor';

import { getListOfModules, getModule, getListOfProjects, getProject } from './examples/registry';
import { requestRuntime } from './runtime-loader';
import {
	loadSession,
	saveSession,
	loadEditorSettings,
	saveEditorSettings,
	importProject,
	exportProject,
	importBinaryFile,
	exportBinaryFile,
	getStorageQuota,
} from './storage-callbacks';
import { compileProject } from './compiler-callback';

import type { ColorScheme } from '@8f4e/sprite-generator';

// Memoized color scheme loader
let colorSchemesPromise: Promise<Record<string, ColorScheme>> | null = null;

function loadColorSchemes(): Promise<Record<string, ColorScheme>> {
	if (!colorSchemesPromise) {
		colorSchemesPromise = import('./color-schemes').then(module => module.default);
	}
	return colorSchemesPromise;
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
		callbacks: {
			getListOfModules,
			getModule,
			getListOfProjects,
			getProject,
			requestRuntime,
			compileProject,
			loadSession,
			saveSession,
			loadEditorSettings,
			saveEditorSettings,
			importProject,
			exportProject,
			importBinaryFile,
			exportBinaryFile,
			loadColorSchemes,
			getStorageQuota,
		},
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
