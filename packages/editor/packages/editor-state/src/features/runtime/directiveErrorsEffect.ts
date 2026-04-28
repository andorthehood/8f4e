import { resolveRuntimeDirectiveState } from './directives';

import deepEqual from '../../shared/utils/deepEqual';

import type { StateManager } from '@8f4e/state-manager';
import type { State } from '~/types';

export default function runtimeDirectiveErrorsEffect(store: StateManager<State>): void {
	function updateErrors(): void {
		const state = store.getState();
		const { errors } = resolveRuntimeDirectiveState(state);

		if (!deepEqual(errors, state.codeErrors.runtimeDirectiveErrors)) {
			store.set('codeErrors.runtimeDirectiveErrors', errors);
		}
	}

	store.subscribe('graphicHelper.codeBlocks', updateErrors);
	store.subscribe('graphicHelper.selectedCodeBlock.code', updateErrors);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', updateErrors);
	store.subscribe('initialProjectState', updateErrors);
	store.subscribe('editorConfig.runtime', updateErrors);
	store.subscribe('runtimeRegistry', updateErrors);
}
