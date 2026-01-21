import { StateManager } from '@8f4e/state-manager';

import { warn, error } from '../logger/logger';
import { extractConfigType } from '../config-compiler/extractConfigBody';
import getBlockType from '../code-blocks/utils/codeParsers/getBlockType';

import type { Project, State, CodeBlock } from '~/types';

import { EventDispatcher, EMPTY_DEFAULT_PROJECT } from '~/types';

/**
 * Filters out editor config blocks from imported projects.
 * Editor config blocks are session-specific and should not be imported.
 */
function filterEditorConfigBlocks(codeBlocks: CodeBlock[]): CodeBlock[] {
	return codeBlocks.filter(block => {
		const blockType = getBlockType(block.code);
		if (blockType !== 'config') {
			return true;
		}
		const configType = extractConfigType(block.code);
		return configType !== 'editor';
	});
}

export default function projectImport(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	const projectPromise = Promise.resolve().then(() => {
		if (!state.featureFlags.persistentStorage || !state.callbacks.loadSession) {
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

	async function loadProjectBySlug({ projectSlug }: { projectSlug: string }) {
		if (!state.callbacks.getProject) {
			console.warn('No getProject callback provided');
			warn(state, 'No getProject callback provided');
			return;
		}
		const project = await state.callbacks.getProject(projectSlug);
		loadProject({ project });
	}

	function loadProject({ project: newProject }: { project: Project }) {
		// Filter out editor config blocks before setting the project
		const filteredProject = {
			...newProject,
			codeBlocks: filterEditorConfigBlocks(newProject.codeBlocks),
		};
		store.set('initialProjectState', filteredProject);
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
	events.on('loadProjectBySlug', loadProjectBySlug);
}
