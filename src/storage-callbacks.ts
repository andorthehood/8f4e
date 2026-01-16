import { getProject, projectManifest } from './examples/registry';
import { getCodeBuffer } from './compiler-callback';

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
		const projectName = kebabCaseToCamelCase(location.hash.match(/#\/([a-z-]*)/)?.[1] || '');
		if (projectName && projectManifest[projectName]) {
			console.log('Loading project from URL hash:', projectName);
			return await getProject(projectName);
		}

		const stored = localStorage.getItem(STORAGE_KEYS.PROJECT);
		if (stored) {
			console.log('Loading project from localStorage');
			return JSON.parse(stored);
		}

		if (Object.keys(projectManifest).length > 0) {
			console.log('Loading default project: audioBuffer');
			return await getProject('audioBuffer');
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

export async function importProject(): Promise<Project> {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json';

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
					const project = JSON.parse(content);
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

export async function exportBinaryCode(fileName: string): Promise<void> {
	const blob = new Blob([new Uint8Array(getCodeBuffer())], { type: 'application/wasm' });
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
