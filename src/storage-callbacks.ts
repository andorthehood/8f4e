import { getProject, projectManifest } from './examples/registry';

import type { Project, EditorSettings } from '@8f4e/editor';

// Storage key constants
const STORAGE_KEYS = {
	PROJECT: 'project_editor',
	EDITOR_SETTINGS: 'editorSettings_editor',
} as const;

const kebabCaseToCamelCase = (str: string) =>
	str.replace(/-([a-z])/g, function (g) {
		return g[1].toUpperCase();
	});

// Implementation of storage callbacks using localStorage
export async function loadSession(): Promise<Project | null> {
	try {
		// First, check if there's a project specified in the URL hash
		const projectName = kebabCaseToCamelCase(location.hash.match(/#\/([a-z-]*)/)?.[1] || '');
		if (projectName && projectManifest[projectName]) {
			console.log('Loading project from URL hash:', projectName);
			return await getProject(projectName);
		}

		// If no URL hash project, try to load from localStorage
		const stored = localStorage.getItem(STORAGE_KEYS.PROJECT);
		if (stored) {
			console.log('Loading project from localStorage');
			return JSON.parse(stored);
		}

		// Fall back to default project (audioBuffer) if available
		if (Object.keys(projectManifest).length > 0) {
			console.log('Loading default project: audioBuffer');
			return await getProject('audioBuffer');
		}

		// Return null if no project can be determined - editor will use empty default
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

export async function loadEditorSettings(): Promise<EditorSettings | null> {
	try {
		const stored = localStorage.getItem(STORAGE_KEYS.EDITOR_SETTINGS);
		return stored ? JSON.parse(stored) : null;
	} catch (error) {
		console.error('Failed to load editor settings from localStorage:', error);
		return null;
	}
}

export async function saveEditorSettings(settings: EditorSettings): Promise<void> {
	try {
		localStorage.setItem(STORAGE_KEYS.EDITOR_SETTINGS, JSON.stringify(settings));
	} catch (error) {
		console.error('Failed to save editor settings to localStorage:', error);
		throw error;
	}
}

// Implementation of file handling callbacks using browser APIs
export async function importProject(file: File): Promise<Project> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = event => {
			try {
				const content = event.target?.result as string;
				const project = JSON.parse(content);
				resolve(project);
			} catch (error) {
				reject(new Error('Failed to parse project file: ' + error));
			}
		};
		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsText(file, 'UTF-8');
	});
}

export async function exportFile(data: Uint8Array | string, filename: string, mimeType?: string): Promise<void> {
	let blob: Blob;

	if (typeof data === 'string') {
		// Handle text data (like JSON for projects)
		blob = new Blob([data], { type: mimeType || 'application/json' });
	} else {
		// Handle binary data (like WASM bytecode)
		// Create a new Uint8Array to ensure ArrayBuffer compatibility
		blob = new Blob([new Uint8Array(data)], { type: mimeType || 'application/wasm' });
	}

	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	document.body.appendChild(a);
	a.style.display = 'none';
	a.href = url;
	a.download = filename;
	a.click();

	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export async function importBinaryAsset(): Promise<{ buffer: ArrayBuffer; fileName: string }> {
	const fileHandles = await (
		window as unknown as { showOpenFilePicker: () => Promise<FileSystemFileHandle[]> }
	).showOpenFilePicker();
	const file = await fileHandles[0].getFile();

	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = event => {
			try {
				const buffer = event.target?.result as ArrayBuffer;
				resolve({ buffer, fileName: file.name });
			} catch (error) {
				reject(new Error('Failed to process binary asset: ' + error));
			}
		};
		reader.onerror = () => reject(new Error('Failed to read binary asset file'));
		reader.readAsArrayBuffer(file);
	});
}

export async function getStorageQuota(): Promise<{ usedBytes: number; totalBytes: number }> {
	if (navigator.storage && navigator.storage.estimate) {
		const estimate = await navigator.storage.estimate();
		return {
			usedBytes: estimate.usage || 0,
			totalBytes: estimate.quota || 0,
		};
	} else {
		return {
			usedBytes: 0,
			totalBytes: 0,
		};
	}
}
