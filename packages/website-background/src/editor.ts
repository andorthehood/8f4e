import initEditor, { CompilationResult, Project } from '@8f4e/editor';
import { createMainThreadLogicRuntimeDef } from '@8f4e/runtime-main-thread-logic/runtime-def';

import defaultColorScheme from './defaultColorScheme';
import compiledProject from './project-runtime-ready.json';

import type { CompiledFunctionLookup, CompiledModuleLookup } from '@8f4e/compiler';

const getCodeBuffer = () => {
	// transforms the base64 string to Uint8Array
	const binaryString = atob(compiledProject.compiledWasm);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
};

const getMemory = () => {
	// For simplicity, we create a new memory with the initial size from the compiled project
	return new WebAssembly.Memory({ initial: 1, maximum: 1 });
};

async function init() {
	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	const editor = await initEditor(canvas, {
		featureFlags: {
			infoOverlay: false,
			moduleDragging: false,
			viewportDragging: false,
		},
		runtimeRegistry: {
			MainThreadLogicRuntime: createMainThreadLogicRuntimeDef(getCodeBuffer, getMemory),
		},
		defaultRuntimeId: 'MainThreadLogicRuntime',
		callbacks: {
			compileCode: async () => {
				const codeBuffer = getCodeBuffer();
				const result: CompilationResult = {
					compiledModules: compiledProject.compiledModules as unknown as CompiledModuleLookup,
					codeBuffer,
					allocatedMemorySize: 2132435435,
					hasWasmInstanceBeenReset: false,
					memoryAction: { action: 'recreated', reason: { kind: 'no-instance' } },
					compiledFunctions: {} as CompiledFunctionLookup,
					byteCodeSize: codeBuffer.length,
				};
				return result;
			},
			compileConfig: async () => {
				return { config: compiledProject.compiledProjectConfig, errors: [] };
			},
			loadSession: async () => {
				return compiledProject as unknown as Project;
			},
			loadEditorConfigBlocks: async () => {
				return null;
			},
			getListOfColorSchemes: async () => ['default'],
			getColorScheme: async () => defaultColorScheme,
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
