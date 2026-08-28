import type { BrowserLocalNoteStorageBlock } from '@8f4e/editor-core';
import type { ProjectObjectModel } from '@8f4e/language-spec';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStorageCallbacks } from './storage-callbacks';

const { parseProjectSource, getDefaultProjectUrl, getProject } = vi.hoisted(() => ({
	parseProjectSource: vi.fn(),
	getDefaultProjectUrl: vi.fn(),
	getProject: vi.fn(),
}));

vi.mock('@8f4e/compiler', () => ({ parseProjectSource }));
vi.mock('./examples/projectRegistry', () => ({ getDefaultProjectUrl, getProject }));

function createMemoryStorage(): Storage {
	const values = new Map<string, string>();

	return {
		get length() {
			return values.size;
		},
		clear: () => values.clear(),
		getItem: key => values.get(key) ?? null,
		key: index => Array.from(values.keys())[index] ?? null,
		removeItem: key => values.delete(key),
		setItem: (key, value) => values.set(key, value),
	};
}

describe('storage callbacks', () => {
	beforeEach(() => {
		parseProjectSource.mockReset();
		getDefaultProjectUrl.mockReset();
		getProject.mockReset();
	});

	it('isolates projects and browser-local notes by namespace', async () => {
		const storage = createMemoryStorage();
		const first = createStorageCallbacks({ storage, storageNamespace: 'first' });
		const second = createStorageCallbacks({ storage, storageNamespace: 'second' });
		const firstProject = { title: 'First' } as unknown as ProjectObjectModel;
		const secondProject = { title: 'Second' } as unknown as ProjectObjectModel;
		const firstNotes: BrowserLocalNoteStorageBlock[] = [{ code: ['note', 'first', 'noteEnd'] }];
		const secondNotes: BrowserLocalNoteStorageBlock[] = [{ code: ['note', 'second', 'noteEnd'] }];

		await first.saveSession(firstProject);
		await second.saveSession(secondProject);
		await first.saveBrowserLocalNotes(firstNotes);
		await second.saveBrowserLocalNotes(secondNotes);

		expect(storage.getItem('project_first')).toBe(JSON.stringify(firstProject));
		expect(storage.getItem('project_second')).toBe(JSON.stringify(secondProject));
		expect(storage.getItem('browserLocalNotes_first')).toBe(JSON.stringify(firstNotes));
		expect(storage.getItem('browserLocalNotes_second')).toBe(JSON.stringify(secondNotes));
		expect(await first.loadSession()).toEqual(firstProject);
		expect(await second.loadSession()).toEqual(secondProject);
		expect(await first.loadBrowserLocalNotes()).toEqual(firstNotes);
		expect(await second.loadBrowserLocalNotes()).toEqual(secondNotes);
	});

	it('uses an initial project URL once before falling back to persisted state', async () => {
		const storage = createMemoryStorage();
		const persistedProject = { title: 'Persisted' } as unknown as ProjectObjectModel;
		const initialProject = { title: 'Initial' } as unknown as ProjectObjectModel;
		storage.setItem('project_editor', JSON.stringify(persistedProject));
		getProject.mockResolvedValue('initial project source');
		parseProjectSource.mockReturnValue(initialProject);
		const callbacks = createStorageCallbacks({
			storage,
			storageNamespace: 'editor',
			initialProjectUrl: 'https://example.com/initial.8f4e',
		});

		expect(await callbacks.loadSession()).toBe(initialProject);
		expect(await callbacks.loadSession()).toEqual(persistedProject);
		expect(getProject).toHaveBeenCalledOnce();
		expect(getProject).toHaveBeenCalledWith('https://example.com/initial.8f4e');
		expect(parseProjectSource).toHaveBeenCalledWith('initial project source');
	});
});
