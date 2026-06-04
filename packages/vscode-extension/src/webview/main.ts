import initEditor, {
	type BrowserLocalNoteStorageBlock,
	type Editor,
	type Project,
	type RuntimeRegistry,
} from '@8f4e/editor';
import { parse8f4eToProject, serializeProjectTo8f4e } from '@8f4e/editor-state';
import { createMainThreadRuntimeDef } from '@8f4e/runtime-main-thread/runtime-def';
import { compileCode, getCodeBuffer, getMemory } from './compile';
import { createMainLoopRuntimeDef } from './mainLoopRuntime';
import { createRequestBridge } from './requestBridge';
import { createScriptProcessorAudioRuntimeDef } from './scriptProcessorAudioRuntime';
import { getVsCodeApi } from './vscodeApi';

type ExtensionMessage =
	| {
			type: 'loadDocument';
			text: string;
			fileName: string;
	  }
	| {
			type: 'response';
			id: string;
			ok: boolean;
			payload?: unknown;
			error?: string;
	  };

const vscode = getVsCodeApi();
const bridge = createRequestBridge(vscode);
let editor: Editor | null = null;
let loadedProjectSource = '';
let localNotes: BrowserLocalNoteStorageBlock[] | null = null;
let saveTimer: number | undefined;
let resolveInitialDocument: (() => void) | undefined;
const initialDocumentPromise = new Promise<void>(resolve => {
	resolveInitialDocument = resolve;
});

const runtimeRegistry: RuntimeRegistry = {
	MainThreadRuntime: createMainThreadRuntimeDef(getCodeBuffer, getMemory),
	WebWorkerRuntime: createMainLoopRuntimeDef({
		id: 'WebWorkerRuntime',
		configRoot: 'workerRuntime',
		defaultSampleRate: 50,
		getCodeBuffer,
		getMemory,
	}),
	AudioWorkletRuntime: createScriptProcessorAudioRuntimeDef(getCodeBuffer, getMemory),
};

window.addEventListener('message', event => {
	const message = event.data as ExtensionMessage;

	if (bridge.handleResponse(message)) {
		return;
	}

	if (message.type === 'loadDocument') {
		loadedProjectSource = message.text;
		resolveInitialDocument?.();
		resolveInitialDocument = undefined;
	}
});

async function init(): Promise<void> {
	await initialDocumentPromise;

	const canvas = document.getElementById('glcanvas') as HTMLCanvasElement | null;
	if (!canvas) {
		throw new Error('Missing 8f4e editor canvas.');
	}

	applyCanvasSize(canvas);

	editor = await initEditor(canvas, {
		callbacks: {
			compileCode: (input, compilerOptions) => {
				if (!editor) {
					throw new Error('8f4e editor is not ready.');
				}

				return compileCode(input, compilerOptions, editor);
			},
			exportBinaryCode,
			exportCanvasScreenshot,
			exportProject,
			importProject,
			loadBrowserLocalNotes,
			loadSession,
			saveBrowserLocalNotes,
			saveSession,
		},
		runtimeRegistry,
	});

	window.addEventListener('resize', () => {
		if (!editor) {
			return;
		}

		applyCanvasSize(canvas);
		editor.resize(canvas.width, canvas.height);
	});
}

function applyCanvasSize(canvas: HTMLCanvasElement): void {
	const width = Math.max(1, window.innerWidth);
	const height = Math.max(1, window.innerHeight);
	canvas.width = width;
	canvas.height = height;
	canvas.style.width = `${width}px`;
	canvas.style.height = `${height}px`;
}

async function loadSession(): Promise<Project | null> {
	if (!loadedProjectSource.trim()) {
		return null;
	}

	return parse8f4eToProject(loadedProjectSource);
}

async function saveSession(project: Project): Promise<void> {
	window.clearTimeout(saveTimer);
	saveTimer = window.setTimeout(() => {
		vscode.postMessage({
			type: 'documentChanged',
			text: serializeProjectTo8f4e(project),
		});
	}, 150);
}

async function importProject(): Promise<Project> {
	const source = await bridge.request<string | null>('importProject');
	if (!source) {
		throw new Error('No 8f4e project was selected.');
	}

	return parse8f4eToProject(source);
}

async function exportProject(data: string, fileName: string): Promise<void> {
	await bridge.request('exportText', {
		fileName,
		text: data,
	});
}

async function exportBinaryCode(fileName: string): Promise<void> {
	await bridge.request('exportBytes', {
		bytes: Array.from(getCodeBuffer()),
		fileName,
	});
}

async function exportCanvasScreenshot(blob: Blob, fileName: string): Promise<void> {
	await bridge.request('exportBytes', {
		bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
		fileName,
	});
}

async function loadBrowserLocalNotes(): Promise<BrowserLocalNoteStorageBlock[] | null> {
	return localNotes;
}

async function saveBrowserLocalNotes(blocks: BrowserLocalNoteStorageBlock[]): Promise<void> {
	localNotes = blocks;
}

init().catch(error => {
	console.error(error);
});
vscode.postMessage({ type: 'ready' });
