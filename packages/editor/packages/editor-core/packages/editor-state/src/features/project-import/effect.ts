import { parseProjectSource } from '@8f4e/compiler';
import type { EventDispatcher, State } from '@8f4e/editor-state-types';
import type { ProjectObjectModel } from '@8f4e/language-spec';
import type { StateManager } from '@8f4e/state-manager';
import { EMPTY_DEFAULT_PROJECT } from '~/features/project-import/emptyDefaultProject';
import { error, warn } from '../logger/logger';

export default function projectImport(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();
	let disposed = false;
	let loadGeneration = 0;

	function isCurrentLoad(generation: number): boolean {
		return !disposed && generation === loadGeneration;
	}

	function commitLoadedProject(project: ProjectObjectModel, generation: number): void {
		if (isCurrentLoad(generation)) {
			store.set('initialProjectState', project);
		}
	}

	function onLoadSession() {
		if (disposed) {
			return;
		}

		const generation = ++loadGeneration;
		if (!state.callbacks.loadSession) {
			commitLoadedProject(EMPTY_DEFAULT_PROJECT, generation);
			return;
		}

		state.callbacks
			.loadSession()
			.then(localProject => {
				commitLoadedProject(localProject ?? EMPTY_DEFAULT_PROJECT, generation);
			})
			.catch(err => {
				if (!isCurrentLoad(generation)) {
					return;
				}

				console.warn('Failed to load project from storage:', err);
				warn(state, 'Failed to load project from storage');
				commitLoadedProject(EMPTY_DEFAULT_PROJECT, generation);
			});
	}

	async function loadProjectByUrl({ projectUrl }: { projectUrl: string }) {
		if (disposed) {
			return;
		}

		const generation = ++loadGeneration;
		if (!state.callbacks.getProject) {
			console.warn('No getProject callback provided');
			warn(state, 'No getProject callback provided');
			return;
		}
		try {
			const projectText = await state.callbacks.getProject(projectUrl);
			if (!isCurrentLoad(generation)) {
				return;
			}
			const project = parseProjectSource(projectText);
			commitLoadedProject(project, generation);
		} catch (err) {
			if (!isCurrentLoad(generation)) {
				return;
			}

			console.error('Failed to load project by url:', err);
			error(state, 'Failed to load project by url');
			commitLoadedProject(EMPTY_DEFAULT_PROJECT, generation);
		}
	}

	function loadProject({ project }: { project: ProjectObjectModel }) {
		if (disposed) {
			return;
		}

		commitLoadedProject(project, ++loadGeneration);
	}

	function onImportProject() {
		if (disposed) {
			return;
		}

		const generation = ++loadGeneration;
		if (!state.callbacks.importProject) {
			console.warn('No importProject callback provided');
			warn(state, 'No importProject callback provided');
			return;
		}

		state.callbacks
			.importProject()
			.then(project => {
				commitLoadedProject(project, generation);
			})
			.catch(err => {
				if (!isCurrentLoad(generation)) {
					return;
				}

				console.error('Failed to load project from file:', err);
				error(state, 'Failed to load project from file');
			});
	}

	events.on('importProject', onImportProject);
	events.on('loadProject', loadProject);
	events.on('loadProjectByUrl', loadProjectByUrl);
	events.on('loadSession', onLoadSession);

	return () => {
		disposed = true;
		loadGeneration++;
		events.off('importProject', onImportProject);
		events.off('loadProject', loadProject);
		events.off('loadProjectByUrl', loadProjectByUrl);
		events.off('loadSession', onLoadSession);
	};
}
