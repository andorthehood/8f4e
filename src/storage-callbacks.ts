import { parse8f4eToProject } from '@8f4e/editor-state';

import { getProjectRegistry } from './examples/lazyProjectRegistry';
import { getCodeBuffer } from './compiler-callback';

import type { Project, EditorConfigBlock } from '@8f4e/editor';

// Storage key constants
const STORAGE_KEYS = {
	PROJECT: 'project_editor',
	EDITOR_CONFIG_BLOCKS: 'editorConfigBlocks_editor',
} as const;

// Implementation of storage callbacks using localStorage
export async function loadSession(): Promise<Project | null> {
	try {
		const projectUrlFromQuery = new URLSearchParams(location.search).get('projectUrl') || '';
		if (projectUrlFromQuery) {
			const url = new URL(window.location.href);
			url.searchParams.delete('projectUrl');
			const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
			window.history.replaceState({}, '', cleanUrl);

			console.log('Loading project from query param:', projectUrlFromQuery);
			const projectRegistry = await getProjectRegistry();
			return parse8f4eToProject(await projectRegistry.getProject(projectUrlFromQuery));
		}

		const stored = localStorage.getItem(STORAGE_KEYS.PROJECT);
		if (stored) {
			console.log('Loading project from localStorage');
			return JSON.parse(stored);
		}

		const projectRegistry = await getProjectRegistry();
		const defaultProjectUrl = projectRegistry.getDefaultProjectUrl();
		if (defaultProjectUrl) {
			console.log(`Loading default project: ${defaultProjectUrl}`);
			return parse8f4eToProject(await projectRegistry.getProject(defaultProjectUrl));
		}

		return null;
	} catch (error) {
		console.error('Failed to load project from localStorage:', error);
		return null;
	}
}

export async function saveSession(project: Project): Promise<void> {
	try {
		localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(project));
	} catch (error) {
		console.error('Failed to save project to localStorage:', error);
		throw error;
	}
}

export async function loadEditorConfigBlocks(): Promise<EditorConfigBlock[] | null> {
	try {
		const stored = localStorage.getItem(STORAGE_KEYS.EDITOR_CONFIG_BLOCKS);
		return stored ? JSON.parse(stored) : null;
	} catch (error) {
		console.error('Failed to load editor config blocks from localStorage:', error);
		return null;
	}
}

export async function saveEditorConfigBlocks(blocks: EditorConfigBlock[]): Promise<void> {
	try {
		localStorage.setItem(STORAGE_KEYS.EDITOR_CONFIG_BLOCKS, JSON.stringify(blocks));
	} catch (error) {
		console.error('Failed to save editor config blocks to localStorage:', error);
		throw error;
	}
}

export async function importProject(): Promise<Project> {
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
			reader.onload = event => {
				try {
					const content = event.target?.result as string;
					const project = parse8f4eToProject(content);
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
	const blob = new Blob([data], { type: 'application/json' });
	await saveBlobWithPickerFallback(blob, fileName, {
		description: '8f4e Project',
		accept: { 'application/json': ['.8f4e', '.json'] },
	});
}

export async function exportBinaryCode(fileName: string): Promise<void> {
	const blob = new Blob([new Uint8Array(getCodeBuffer())], { type: 'application/wasm' });

	await saveBlobWithPickerFallback(blob, fileName, {
		description: 'WebAssembly Binary',
		accept: { 'application/wasm': ['.wasm'] },
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
