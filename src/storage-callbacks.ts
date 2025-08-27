import type { Project, EditorSettings } from '@8f4e/editor';

// Storage key constants
const STORAGE_KEYS = {
	PROJECT: 'project_editor',
	EDITOR_SETTINGS: 'editorSettings_editor',
} as const;

// Implementation of storage callbacks using localStorage
export async function loadProjectFromStorage(): Promise<Project | null> {
	try {
		const stored = localStorage.getItem(STORAGE_KEYS.PROJECT);
		return stored ? JSON.parse(stored) : null;
	} catch (error) {
		console.error('Failed to load project from localStorage:', error);
		return null;
	}
}

export async function saveProjectToStorage(project: Project): Promise<void> {
	try {
		localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(project));
	} catch (error) {
		console.error('Failed to save project to localStorage:', error);
		throw error;
	}
}

export async function loadEditorSettingsFromStorage(): Promise<EditorSettings | null> {
	try {
		const stored = localStorage.getItem(STORAGE_KEYS.EDITOR_SETTINGS);
		return stored ? JSON.parse(stored) : null;
	} catch (error) {
		console.error('Failed to load editor settings from localStorage:', error);
		return null;
	}
}

export async function saveEditorSettingsToStorage(settings: EditorSettings): Promise<void> {
	try {
		localStorage.setItem(STORAGE_KEYS.EDITOR_SETTINGS, JSON.stringify(settings));
	} catch (error) {
		console.error('Failed to save editor settings to localStorage:', error);
		throw error;
	}
}

// Implementation of file handling callbacks using browser APIs
export async function loadProjectFromFile(file: File): Promise<Project> {
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

export async function saveProjectToFile(project: Project, filename: string): Promise<void> {
	const json = JSON.stringify(project, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
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

export async function importBinaryAsset(file: File): Promise<{ data: string; fileName: string }> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = event => {
			try {
				const dataUrl = event.target?.result as string;
				const base64data = dataUrl.split(',')[1];
				resolve({ data: base64data, fileName: file.name });
			} catch (error) {
				reject(new Error('Failed to process binary asset: ' + error));
			}
		};
		reader.onerror = () => reject(new Error('Failed to read binary asset file'));
		reader.readAsDataURL(file);
	});
}
