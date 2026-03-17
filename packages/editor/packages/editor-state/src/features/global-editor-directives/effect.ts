import { defaultColorScheme } from '@8f4e/sprite-generator';

import { resolveGlobalEditorDirectives } from './registry';

import deepEqual from '../../shared/utils/deepEqual';

import type { StateManager } from '@8f4e/state-manager';
import type { State } from '~/types';

/**
 * Global-editor-directives effect.
 *
 * Scans all code blocks in `graphicHelper.codeBlocks` for global `; @<name>`
 * editor directives and updates `state.globalEditorDirectives` with the resolved values.
 *
 * Conflicting directive values are written to `state.codeErrors.globalEditorDirectiveErrors`.
 */
export default function globalEditorDirectivesEffect(store: StateManager<State>): void {
	function resolve(): void {
		const state = store.getState();
		const { resolved, errors } = resolveGlobalEditorDirectives(state.graphicHelper.codeBlocks, state.runtimeRegistry);
		const nextColorScheme = resolved.colorScheme ?? defaultColorScheme;

		if (!deepEqual(resolved, state.globalEditorDirectives)) {
			store.set('globalEditorDirectives', resolved);
		}

		if (!deepEqual(nextColorScheme, state.colorScheme)) {
			store.set('colorScheme', nextColorScheme);
		}

		if (!deepEqual(errors, state.codeErrors.globalEditorDirectiveErrors)) {
			store.set('codeErrors.globalEditorDirectiveErrors', errors);
		}
	}

	store.subscribe('graphicHelper.codeBlocks', resolve);
	store.subscribe('graphicHelper.selectedCodeBlock.code', resolve);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', resolve);
}
