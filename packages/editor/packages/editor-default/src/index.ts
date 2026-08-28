import initEditor, { type Editor } from '@8f4e/editor-core';
import { compileCode } from './compiler-callback';
import { getListOfModules, getModule, getModuleDependencies } from './examples/moduleRegistry';
import { getListOfProjects, getProject } from './examples/projectRegistry';
import { runtimeRegistry } from './runtime-registry';
import { resolveStdlibInclude } from './stdlib-resolver';
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

export async function mountDefaultEditor(canvas: HTMLCanvasElement): Promise<Editor> {
	const editor = await initEditor(canvas, {
		runtimeRegistry,
		callbacks: {
			getListOfModules,
			getModule,
			getModuleDependencies,
			getListOfProjects,
			getProject,
			resolveInclude: resolveStdlibInclude,
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

	return editor;
}
