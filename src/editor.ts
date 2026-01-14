import initEditor from '@8f4e/editor';
import { ColorScheme } from '@8f4e/sprite-generator';

import { getListOfModules, getModule, getListOfProjects, getProject } from './examples/registry';
import { runtimeRegistry, DEFAULT_RUNTIME_ID } from './runtime-registry';
import {
	loadSession,
	saveSession,
	loadEditorSettings,
	saveEditorSettings,
	importProject,
	exportProject,
	importBinaryAsset,
	exportBinaryCode,
} from './storage-callbacks';
import { compileCode } from './compiler-callback';
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
		runtimeRegistry,
		defaultRuntimeId: DEFAULT_RUNTIME_ID,
		callbacks: {
			getListOfModules,
			getModule,
			getListOfProjects,
			getProject,
			compileCode: (modules, compilerOptions, functions) => compileCode(modules, compilerOptions, functions, editor),
			compileConfig,
			loadSession,
			saveSession,
			loadEditorSettings,
			saveEditorSettings,
			importProject,
			exportProject,
			importBinaryAsset,
			exportBinaryCode,
			getListOfColorSchemes,
			getColorScheme,
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
