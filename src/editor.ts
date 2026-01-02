import initEditor from '@8f4e/editor';
import { ColorScheme } from '@8f4e/sprite-generator';

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
import compileConfig from './config-callback';

async function getListOfColorSchemes(): Promise<string[]> {
	return ['hackerman', 'redalert', 'default'];
}

async function getColorScheme(name: string): Promise<ColorScheme> {
	const module = await import(`./colorSchemes/${name}.ts`);
	return module.default;
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
			compileConfig,
			loadSession,
			saveSession,
			loadEditorSettings,
			saveEditorSettings,
			importProject,
			exportProject,
			importBinaryFile,
			exportBinaryFile,
			getListOfColorSchemes,
			getColorScheme,
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
