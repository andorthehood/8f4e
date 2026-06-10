import type { EventDispatcher, Project, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import { EMPTY_DEFAULT_PROJECT } from '~/features/project-import/emptyDefaultProject';
import { error, warn } from '../logger/logger';
import { parse8f4eToProjectAsync } from './parse8f4e';

export default function projectImport(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function onLoadSession() {
		if (!state.callbacks.loadSession) {
			loadProject({ project: EMPTY_DEFAULT_PROJECT });
			return;
		}

		state.callbacks
			.loadSession()
			.then(localProject => {
				loadProject({ project: localProject ?? EMPTY_DEFAULT_PROJECT });
			})
			.catch(err => {
				console.warn('Failed to load project from storage:', err);
				warn(state, 'Failed to load project from storage');
				loadProject({ project: EMPTY_DEFAULT_PROJECT });
			});
	}

	async function loadProjectByUrl({ projectUrl }: { projectUrl: string }) {
		if (!state.callbacks.getProject) {
			console.warn('No getProject callback provided');
			warn(state, 'No getProject callback provided');
			return;
		}
		try {
			const projectText = await state.callbacks.getProject(projectUrl);
			const project = await parse8f4eToProjectAsync(projectText, {
				resolveInclude: state.callbacks.resolveInclude,
			});
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
	events.on('loadSession', onLoadSession);
}
