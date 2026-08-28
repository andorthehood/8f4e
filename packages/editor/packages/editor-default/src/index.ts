import initEditor, { type Editor } from '@8f4e/editor-core';
import { createCompilerService } from './compiler-callback';
import { getListOfModules, getModule, getModuleDependencies } from './examples/moduleRegistry';
import { getListOfProjects, getProject } from './examples/projectRegistry';
import { createRuntimeRegistry } from './runtime-registry';
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
	const compilerService = createCompilerService();
	let editor: Editor;
	try {
		editor = await initEditor(canvas, {
			runtimeRegistry: createRuntimeRegistry(compilerService),
			callbacks: {
				getListOfModules,
				getModule,
				getModuleDependencies,
				getListOfProjects,
				getProject,
				resolveInclude: resolveStdlibInclude,
				compileCode: (input, compilerOptions) => compilerService.compileCode(input, compilerOptions, editor),
				loadSession,
				saveSession,
				loadBrowserLocalNotes,
				saveBrowserLocalNotes,
				importProject,
				exportProject,
				exportBinaryCode: fileName => exportBinaryCode(fileName, compilerService.getCodeBuffer()),
				exportCanvasScreenshot,
			},
		});
	} catch (error) {
		compilerService.dispose();
		throw error;
	}

	// @ts-expect-error - Expose state for debugging purposes
	window.state = editor.state;

	return {
		...editor,
		dispose: () => {
			try {
				editor.dispose();
			} finally {
				compilerService.dispose();
			}
		},
	};
}
