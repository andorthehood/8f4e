import { StateManager } from '@8f4e/state-manager';

import { parse8f4eToProject } from './parse8f4e';

import { warn, error } from '../logger/logger';

import type { Project, State } from '~/types';

import { EventDispatcher, EMPTY_DEFAULT_PROJECT } from '~/types';

export default function projectImport(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	const projectPromise = Promise.resolve().then(() => {
		if (!state.callbacks.loadSession) {
			return Promise.resolve().then(() => loadProject({ project: EMPTY_DEFAULT_PROJECT }));
		}

		return state.callbacks
			.loadSession()
			.then(localProject => {
				loadProject({ project: localProject || EMPTY_DEFAULT_PROJECT });
			})
			.catch(err => {
				console.warn('Failed to load project from storage:', err);
				warn(state, 'Failed to load project from storage');
				loadProject({ project: EMPTY_DEFAULT_PROJECT });
			});
	});

	async function loadProjectByUrl({ projectUrl }: { projectUrl: string }) {
		if (!state.callbacks.getProject) {
			console.warn('No getProject callback provided');
			warn(state, 'No getProject callback provided');
			return;
		}
		try {
			const projectText = await state.callbacks.getProject(projectUrl);
			const project = parse8f4eToProject(projectText);
			loadProject({ project });
		} catch (err) {
			console.error('Failed to load project by url:', err);
			error(state, 'Failed to load project by url');
			loadProject({ project: EMPTY_DEFAULT_PROJECT });
		}
	}

	function loadProject({ project: newProject }: { project: Project }) {
		store.set('initialProjectState', newProject);
	}

	void projectPromise;

	function onImportProject() {
		if (!state.callbacks.importProject) {
			console.warn('No importProject callback provided');
			warn(state, 'No importProject callback provided');
			return;
		}

		state.callbacks
			.importProject()
			.then(project => {
				loadProject({ project });
			})
			.catch(err => {
				console.error('Failed to load project from file:', err);
				error(state, 'Failed to load project from file');
			});
	}

	events.on('importProject', onImportProject);
	events.on('loadProject', loadProject);
	events.on('loadProjectByUrl', loadProjectByUrl);
}
