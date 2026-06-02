import initEditor, {
	type BrowserLocalNoteStorageBlock,
	type Editor,
	type EditorConfig,
	type EditorConfigSchemaContribution,
	type JSONSchemaLike,
	type Project,
	type RuntimeRegistry,
	type RuntimeRegistryEntry,
} from '@8f4e/editor';
import { parse8f4eToProject, serializeProjectTo8f4e } from '@8f4e/editor-state';
import { createMainThreadRuntimeDef } from '@8f4e/runtime-main-thread/runtime-def';
import { compileCode, getCodeBuffer, getMemory, getSharedMemory, hasSharedMemorySupport } from './compile';
import { createRequestBridge } from './requestBridge';
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

type RuntimeConfigObject = Record<string, unknown>;

declare global {
	var __8f4eAudioWorkletUri: string | undefined;
}

const vscode = getVsCodeApi();
const bridge = createRequestBridge(vscode);
const DEFAULT_RUNTIME_ID = 'MainThreadRuntime';
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

	WebWorkerRuntime: createLazyRuntimeEntry(
		'WebWorkerRuntime',
		{ root: 'workerRuntime', defaults: { sampleRate: 50 }, schema: { type: 'object' } },
		editorConfig => [`const SAMPLE_RATE ${getRuntimeSampleRate(editorConfig, 'workerRuntime', 50)}`],
		async () => {
			if (!hasSharedMemorySupport()) {
				const { createMainLoopFallbackRuntimeDef } = await import('./mainLoopFallbackRuntime');
				return createMainLoopFallbackRuntimeDef({
					id: 'WebWorkerRuntime',
					configRoot: 'workerRuntime',
					defaultSampleRate: 50,
					getCodeBuffer,
					getMemory,
				});
			}

			const [{ createWebWorkerRuntimeDef }, { default: WebWorkerRuntime }] = await Promise.all([
				import('@8f4e/runtime-web-worker/runtime-def'),
				import('@8f4e/runtime-web-worker?worker'),
			]);
			return createWebWorkerRuntimeDef(getCodeBuffer, getSharedMemory, WebWorkerRuntime);
		}
	),

	AudioWorkletRuntime: createLazyRuntimeEntry(
		'AudioWorkletRuntime',
		{ root: 'audioRuntime', defaults: { sampleRate: 48000 }, schema: { type: 'object' } },
		editorConfig => [
			`const SAMPLE_RATE ${getRuntimeSampleRate(editorConfig, 'audioRuntime', 48000)}`,
			'const AUDIO_BUFFER_SIZE 128',
		],
		async () => {
			if (!hasSharedMemorySupport()) {
				const { createScriptProcessorAudioRuntimeDef } = await import('./scriptProcessorAudioRuntime');
				return createScriptProcessorAudioRuntimeDef(getCodeBuffer, getMemory);
			}

			const { createAudioWorkletRuntimeDef } = await import('@8f4e/runtime-audio-worklet/runtime-def');
			return createAudioWorkletRuntimeDef(getCodeBuffer, getSharedMemory, getAudioWorkletUri());
		}
	),
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
		defaultRuntimeId: DEFAULT_RUNTIME_ID,
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

function createLazyRuntimeEntry(
	id: string,
	editorConfigSchema: EditorConfigSchemaContribution,
	getEnvConstants: RuntimeRegistryEntry['getEnvConstants'],
	loader: () => Promise<RuntimeRegistryEntry>
): RuntimeRegistryEntry {
	let loadPromise: Promise<RuntimeRegistryEntry> | null = null;
	const stubSchema: JSONSchemaLike = { type: 'object' };

	const entry: RuntimeRegistryEntry = {
		id,
		editorConfigSchema: {
			...editorConfigSchema,
			schema: stubSchema,
		},
		getEnvConstants,
		factory: (store, events) => {
			let destroyed = false;
			let destroy: (() => void) | null = null;

			if (!loadPromise) {
				loadPromise = loader();
			}

			loadPromise.then(loadedEntry => {
				entry.editorConfigSchema = loadedEntry.editorConfigSchema;
				entry.getEnvConstants = loadedEntry.getEnvConstants;
				store.set('runtimeRegistry', { ...store.getState().runtimeRegistry });

				if (!destroyed) {
					destroy = loadedEntry.factory(store, events);
				}
			});

			return () => {
				destroyed = true;
				destroy?.();
			};
		},
	};

	return entry;
}

function getRuntimeSampleRate(editorConfig: EditorConfig, root: string, defaultSampleRate: number): number {
	const config = editorConfig[root];
	if (!isEditorConfigObject(config)) {
		return defaultSampleRate;
	}

	return typeof config.sampleRate === 'number' ? config.sampleRate : defaultSampleRate;
}

function isEditorConfigObject(value: unknown): value is RuntimeConfigObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getAudioWorkletUri(): string {
	const uri = globalThis.__8f4eAudioWorkletUri;
	if (!uri) {
		throw new Error('Missing 8f4e audio worklet URI.');
	}

	return uri;
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
