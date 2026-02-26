import { StateManager } from '@8f4e/state-manager';

import parseDirectives from './parseDirectives';

import deepEqual from '../config-compiler/utils/deepEqual';

import type { State } from '~/types';

export default function directivesEffect(store: StateManager<State>): void {
	function updateDirectives(): void {
		const state = store.getState();
		const nextDirectives = parseDirectives(state.graphicHelper.codeBlocks);

		if (!deepEqual(nextDirectives, state.directives)) {
			store.set('directives', nextDirectives);
		}
	}

	updateDirectives();
	store.subscribe('graphicHelper.codeBlocks', updateDirectives);
	store.subscribe('graphicHelper.selectedCodeBlock.code', updateDirectives);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', updateDirectives);
}
