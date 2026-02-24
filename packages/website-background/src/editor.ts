import initEditor from '@8f4e/editor';

import { runtimeRegistry, DEFAULT_RUNTIME_ID } from './runtime-registry';
import { loadSession, loadEditorConfigBlocks } from './storage-callbacks';
import { compileCode } from './compiler-callback';
import compileConfig from './config-callback';

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
			compileCode: (modules, compilerOptions, functions, macros) =>
				compileCode(modules, compilerOptions, functions, editor, macros),
			compileConfig,
			loadSession,
			loadEditorConfigBlocks,
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
