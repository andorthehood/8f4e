import { resolveRuntimeDirectives } from './registry';

import deepEqual from '../config-compiler/utils/deepEqual';

import type { StateManager } from '@8f4e/state-manager';
import type { State } from '~/types';

/**
 * Runtime-directives effect.
 *
 * Scans all code blocks in `graphicHelper.codeBlocks` for `; ~<name>` runtime directives
 * and updates `state.runtimeDirectives` with the resolved values.
 *
 * Conflicting directive values are written to `state.codeErrors.runtimeDirectiveErrors`.
 */
export default function runtimeDirectivesEffect(store: StateManager<State>): void {
	function resolve(): void {
		const state = store.getState();
		const { resolved, errors } = resolveRuntimeDirectives(state.graphicHelper.codeBlocks);

		if (!deepEqual(resolved, state.runtimeDirectives)) {
			store.set('runtimeDirectives', resolved);
		}

		if (!deepEqual(errors, state.codeErrors.runtimeDirectiveErrors)) {
			store.set('codeErrors.runtimeDirectiveErrors', errors);
		}
	}

	store.subscribe('graphicHelper.codeBlocks', resolve);
	store.subscribe('graphicHelper.selectedCodeBlock.code', resolve);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', resolve);
}
