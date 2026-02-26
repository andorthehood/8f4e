import { StateManager } from '@8f4e/state-manager';

import parseDirectives from './parseDirectives';

import deepEqual from '../config-compiler/utils/deepEqual';

import type { State } from '~/types';

export default function directivesEffect(store: StateManager<State>): void {
	function updateDirectivesFromInitialProject(): void {
		const state = store.getState();
		const project = state.initialProjectState;
		if (!project) {
			return;
		}

		const blocks = project.codeBlocks.map(codeBlock => ({ code: codeBlock.code }));

		// Always publish directives for the loaded project so downstream effects can use
		// this as a deterministic readiness signal, even when the parsed list is empty.
		store.set('directives', parseDirectives(blocks));
	}

	function updateDirectivesFromGraphicBlocks(): void {
		const state = store.getState();
		const nextDirectives = parseDirectives(state.graphicHelper.codeBlocks);

		if (!deepEqual(nextDirectives, state.directives)) {
			store.set('directives', nextDirectives);
		}
	}

	updateDirectivesFromInitialProject();
	store.subscribe('initialProjectState', updateDirectivesFromInitialProject);
	store.subscribe('graphicHelper.codeBlocks', updateDirectivesFromGraphicBlocks);
	store.subscribe('graphicHelper.selectedCodeBlock.code', updateDirectivesFromGraphicBlocks);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', updateDirectivesFromGraphicBlocks);
}
