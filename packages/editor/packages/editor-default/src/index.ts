import initEditor, { type Editor } from '@8f4e/editor-core';
import { createCompilerService } from './compiler-callback';
import { getListOfModules, getModule, getModuleDependencies } from './examples/moduleRegistry';
import { getListOfProjects, getProject } from './examples/projectRegistry';
import { createRuntimeRegistry } from './runtime-registry';
import { resolveStdlibInclude } from './stdlib-resolver';
import {
	createStorageCallbacks,
	exportBinaryCode,
	exportCanvasScreenshot,
	exportProject,
	importProject,
} from './storage-callbacks';

const DEFAULT_STORAGE_NAMESPACE = 'editor';

export type DefaultEditorInstance = Editor;

export interface DefaultEditorMountOptions {
	initialProjectUrl?: string;
	storage?: Storage;
	storageNamespace?: string;
}

export async function mountDefaultEditor(
	canvas: HTMLCanvasElement,
	{
		initialProjectUrl,
		storage = localStorage,
		storageNamespace = DEFAULT_STORAGE_NAMESPACE,
	}: DefaultEditorMountOptions = {}
): Promise<DefaultEditorInstance> {
	const compilerService = createCompilerService();
	const storageCallbacks = createStorageCallbacks({ storage, storageNamespace, initialProjectUrl });
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
				...storageCallbacks,
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
