import type { Project, EditorConfigBlock } from '@8f4e/editor';

// Storage key constants
const STORAGE_KEYS = {
	PROJECT: 'project_editor',
	EDITOR_CONFIG_BLOCKS: 'editorConfigBlocks_editor',
} as const;

// Implementation of storage callbacks using localStorage
export async function loadSession(): Promise<Project | null> {
	try {
		const stored = localStorage.getItem(STORAGE_KEYS.PROJECT);
		if (stored) {
			console.log('Loading project from localStorage');
			return JSON.parse(stored);
		}

		return null;
	} catch (error) {
		console.error('Failed to load project from localStorage:', error);
		return null;
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
