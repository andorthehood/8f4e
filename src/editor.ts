import initEditor from '@8f4e/editor';
import { compileConfig, JSONSchemaLike } from '@8f4e/stack-config-compiler';

import { runtimeRegistry, DEFAULT_RUNTIME_ID } from './runtime-registry';
import {
	loadSession,
	saveSession,
	loadEditorConfigBlocks,
	saveEditorConfigBlocks,
	importProject,
	exportProject,
	exportBinaryCode,
} from './storage-callbacks';
import { compileCode } from './compiler-callback';

let registryPromise: Promise<typeof import('./examples/registry')> | null = null;

function getRegistry() {
	if (!registryPromise) {
		registryPromise = import('./examples/registry');
	}
	return registryPromise;
}

async function init() {
	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	const editor = await initEditor(canvas, {
		featureFlags: {
			infoOverlay: true,
		},
		runtimeRegistry,
		defaultRuntimeId: DEFAULT_RUNTIME_ID,
		callbacks: {
			getListOfModules: () => getRegistry().then(r => r.getListOfModules()),
			getModule: (slug: string) => getRegistry().then(r => r.getModule(slug)),
			getModuleDependencies: (slug: string) => getRegistry().then(r => r.getModuleDependencies(slug)),
			getListOfProjects: () => getRegistry().then(r => r.getListOfProjects()),
			getProject: (url: string) => getRegistry().then(r => r.getProject(url)),
			compileCode: (modules, compilerOptions, functions, macros) =>
				compileCode(modules, compilerOptions, functions, editor, macros),
			compileConfig: async (sourceBlocks: string[], schema: JSONSchemaLike) => compileConfig(sourceBlocks, { schema }),
			loadSession,
			saveSession,
			loadEditorConfigBlocks,
			saveEditorConfigBlocks,
			importProject,
			exportProject,
			exportBinaryCode,
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
