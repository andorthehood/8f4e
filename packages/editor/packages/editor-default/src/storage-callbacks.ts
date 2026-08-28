import { parseProjectSource } from '@8f4e/compiler';
import type { BrowserLocalNoteStorageBlock } from '@8f4e/editor-core';
import type { ProjectObjectModel } from '@8f4e/language-spec';
import { getDefaultProjectUrl, getProject } from './examples/projectRegistry';

interface StorageCallbacksOptions {
	storage: Storage;
	storageNamespace: string;
	initialProjectUrl?: string;
}

function createStorageKeys(namespace: string) {
	return {
		project: `project_${namespace}`,
		browserLocalNotes: `browserLocalNotes_${namespace}`,
	};
}

export function createStorageCallbacks({ storage, storageNamespace, initialProjectUrl }: StorageCallbacksOptions) {
	const storageKeys = createStorageKeys(storageNamespace);
	let pendingInitialProjectUrl = initialProjectUrl;

	return {
		async loadSession(): Promise<ProjectObjectModel | null> {
			try {
				const projectUrl = pendingInitialProjectUrl;
				pendingInitialProjectUrl = undefined;
				if (projectUrl) {
					console.log('Loading initial project:', projectUrl);
					return parseProjectSource(await getProject(projectUrl));
				}

				const stored = storage.getItem(storageKeys.project);
				if (stored) {
					console.log(`Loading project from storage namespace "${storageNamespace}"`);
					return JSON.parse(stored);
				}

				const defaultProjectUrl = await getDefaultProjectUrl();
				if (defaultProjectUrl) {
					console.log(`Loading default project: ${defaultProjectUrl}`);
					return parseProjectSource(await getProject(defaultProjectUrl));
				}

				return null;
			} catch (error) {
				console.error('Failed to load editor session:', error);
				return null;
			}
		},
		async saveSession(project: ProjectObjectModel): Promise<void> {
			try {
				storage.setItem(storageKeys.project, JSON.stringify(project));
			} catch (error) {
				console.error('Failed to save project to storage:', error);
				throw error;
			}
		},
		async loadBrowserLocalNotes(): Promise<BrowserLocalNoteStorageBlock[] | null> {
			try {
				const stored = storage.getItem(storageKeys.browserLocalNotes);
				return stored ? JSON.parse(stored) : null;
			} catch (error) {
				console.error('Failed to load browser-local notes from storage:', error);
				return null;
			}
		},
		async saveBrowserLocalNotes(blocks: BrowserLocalNoteStorageBlock[]): Promise<void> {
			try {
				storage.setItem(storageKeys.browserLocalNotes, JSON.stringify(blocks));
			} catch (error) {
				console.error('Failed to save browser-local notes to storage:', error);
				throw error;
			}
		},
	};
}

export async function importProject(): Promise<ProjectObjectModel> {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.8f4e';

	return new Promise((resolve, reject) => {
		input.addEventListener('change', event => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (!file) {
				return;
			}

			const reader = new FileReader();
			reader.onload = async event => {
				try {
					const content = event.target?.result as string;
					const project = parseProjectSource(content);
					resolve(project);
				} catch (error) {
					reject(new Error('Failed to parse project file: ' + error));
				}
			};
			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsText(file, 'UTF-8');
		});

		input.click();
	});
}

export async function exportProject(data: string, fileName: string): Promise<void> {
	const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
	await saveBlobWithPickerFallback(blob, fileName, {
		description: '8f4e Project',
		accept: { 'text/plain': ['.8f4e'] },
	});
}

export async function exportBinaryCode(fileName: string, codeBuffer: Uint8Array): Promise<void> {
	const blob = new Blob([new Uint8Array(codeBuffer)], { type: 'application/wasm' });

	await saveBlobWithPickerFallback(blob, fileName, {
		description: 'WebAssembly Binary',
		accept: { 'application/wasm': ['.wasm'] },
	});
}

export async function exportCanvasScreenshot(blob: Blob, fileName: string): Promise<void> {
	await saveBlobWithPickerFallback(blob, fileName, {
		description: 'PNG Image',
		accept: { 'image/png': ['.png'] },
	});
}

async function saveBlobWithPickerFallback(
	blob: Blob,
	fileName: string,
	fileType: {
		description: string;
		accept: Record<string, string[]>;
	}
): Promise<void> {
	const showSaveFilePicker = (
		window as Window & {
			showSaveFilePicker?: (options: {
				suggestedName: string;
				types: Array<{ description: string; accept: Record<string, string[]> }>;
			}) => Promise<{
				createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
			}>;
		}
	).showSaveFilePicker;

	if (showSaveFilePicker) {
		const handle = await showSaveFilePicker({
			suggestedName: fileName,
			types: [fileType],
		});
		const writable = await handle.createWritable();
		await writable.write(blob);
		await writable.close();
		return;
	}

	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	document.body.appendChild(a);
	a.style.display = 'none';
	a.href = url;
	a.download = fileName;
	a.click();

	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
