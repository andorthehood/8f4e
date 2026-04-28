import { resolveGlobalEditorDirectives } from './registry';

import { resolveEditorConfigEntries, validateEditorConfigEntries } from '../editor-config/validators';
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
		const { configEntries, ...globalEditorDirectives } = resolved;
		const nextEditorConfig = resolveEditorConfigEntries(configEntries ?? [], state.editorConfigValidators);
		const nextErrors = [...errors, ...validateEditorConfigEntries(configEntries ?? [], state.editorConfigValidators)];

		if (!deepEqual(globalEditorDirectives, state.globalEditorDirectives)) {
			store.set('globalEditorDirectives', globalEditorDirectives);
		}

		if (!deepEqual(nextEditorConfig, state.editorConfig)) {
			store.set('editorConfig', nextEditorConfig);
		}

		if (!deepEqual(nextErrors, state.codeErrors.globalEditorDirectiveErrors)) {
			store.set('codeErrors.globalEditorDirectiveErrors', nextErrors);
		}
	}

	store.subscribe('graphicHelper.codeBlocks', resolve);
	store.subscribe('graphicHelper.selectedCodeBlock.code', resolve);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', resolve);
}
