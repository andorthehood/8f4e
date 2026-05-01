import { resolveGlobalEditorDirectives } from './registry';

import { resolveEditorConfigEntries, validateEditorConfigEntries } from '../editor-config/validators';
import deepEqual from '../../shared/utils/deepEqual';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeError, State } from '@8f4e/editor-state-types';

const GLOBAL_EDITOR_DIRECTIVES_ERROR_OWNER_ID = 'global-editor-directives';

function withOwnerId(errors: CodeError[]): CodeError[] {
	return errors.map(error => ({
		...error,
		ownerId: GLOBAL_EDITOR_DIRECTIVES_ERROR_OWNER_ID,
	}));
}

/**
 * Global-editor-directives effect.
 *
 * Scans all code blocks in `graphicHelper.codeBlocks` for global `; @<name>`
 * editor directives and updates `state.globalEditorDirectives` with the resolved values.
 *
 * Conflicting directive values are written to `state.codeErrors.editorDirectiveErrors`.
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

		const nextOwnedErrors = withOwnerId(nextErrors);
		const currentOwnerErrors = state.codeErrors.editorDirectiveErrors.filter(
			error => error.ownerId === GLOBAL_EDITOR_DIRECTIVES_ERROR_OWNER_ID
		);

		if (!deepEqual(nextOwnedErrors, currentOwnerErrors)) {
			store.set(
				'codeErrors.editorDirectiveErrors',
				state.codeErrors.editorDirectiveErrors
					.filter(error => error.ownerId !== GLOBAL_EDITOR_DIRECTIVES_ERROR_OWNER_ID)
					.concat(nextOwnedErrors)
			);
		}
	}

	store.subscribe('graphicHelper.codeBlocks', resolve);
	store.subscribe('graphicHelper.selectedCodeBlock.code', resolve);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', resolve);
}
