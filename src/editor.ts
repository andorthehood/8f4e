import initEditor from '@8f4e/editor';
import { compileCode } from './compiler-callback';
import { getListOfModules, getModule, getModuleDependencies } from './examples/moduleRegistry';
import { getListOfProjects, getProject } from './examples/projectRegistry';
import { runtimeRegistry } from './runtime-registry';
import {
	exportBinaryCode,
	exportCanvasScreenshot,
	exportProject,
	importProject,
	loadBrowserLocalNotes,
	loadSession,
	saveBrowserLocalNotes,
	saveSession,
} from './storage-callbacks';

interface CanvasSize {
	width: number;
	height: number;
}

interface InitOptions {
	fixedCanvasSize?: CanvasSize;
}

function applyCanvasSize(canvas: HTMLCanvasElement, size: CanvasSize): void {
	canvas.width = size.width;
	canvas.height = size.height;
	canvas.style.width = '';
	canvas.style.height = '';
}

function getCanvasSize({ fixedCanvasSize }: InitOptions = {}): CanvasSize {
	if (fixedCanvasSize) {
		return fixedCanvasSize;
	}

	return {
		width: window.innerWidth,
		height: window.innerHeight,
	};
}

async function init(options: InitOptions = {}) {
	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');
	const initialCanvasSize = getCanvasSize(options);
	applyCanvasSize(canvas, initialCanvasSize);
	const editor = await initEditor(canvas, {
		runtimeRegistry,
		callbacks: {
			getListOfModules,
			getModule,
			getModuleDependencies,
			getListOfProjects,
			getProject,
			compileCode: (input, compilerOptions) => compileCode(input, compilerOptions, editor),
			loadSession,
			saveSession,
			loadBrowserLocalNotes,
			saveBrowserLocalNotes,
			importProject,
			exportProject,
			exportBinaryCode,
			exportCanvasScreenshot,
		},
	});

	// @ts-expect-error - Expose state for debugging purposes
	window.state = editor.state;

	const resizeEditor = () => {
		if (options.fixedCanvasSize) {
			return;
		}
		const nextCanvasSize = getCanvasSize(options);
		applyCanvasSize(canvas, nextCanvasSize);
		editor.resize(nextCanvasSize.width, nextCanvasSize.height);
	};

	resizeEditor();

	window.addEventListener('resize', resizeEditor);
}

if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener('DOMContentLoaded', () => init());
}
