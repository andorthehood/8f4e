import { formatDidYouMeanSuffix } from '../global-editor-directives/suggestions';

import type { EditorConfigValidator } from '@8f4e/editor-state-types';
import type { State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import type { RuntimeRegistry, Runtimes } from '@8f4e/editor-state-types';

export const RUNTIME_CONFIG_PATH = 'runtime';

export function resolveSelectedRuntimeId(
	requestedRuntimeId: string | undefined,
	runtimeRegistry: RuntimeRegistry,
	defaultRuntimeId: string
): string {
	if (requestedRuntimeId && requestedRuntimeId in runtimeRegistry) {
		return requestedRuntimeId;
	}

	return defaultRuntimeId;
}

export function getSelectedRuntimeDefaults(
	requestedRuntimeId: string | undefined,
	runtimeRegistry: RuntimeRegistry,
	defaultRuntimeId: string
): Runtimes {
	const resolvedRuntimeId = resolveSelectedRuntimeId(requestedRuntimeId, runtimeRegistry, defaultRuntimeId);
	return runtimeRegistry[resolvedRuntimeId].defaults as unknown as Runtimes;
}

export function createRuntimeEditorConfigValidator(store: StateManager<State>): EditorConfigValidator {
	return {
		knownPaths: [RUNTIME_CONFIG_PATH],
		matches: path => path === RUNTIME_CONFIG_PATH,
		validate: entry => {
			const { runtimeRegistry } = store.getState();
			if (!(entry.value in runtimeRegistry)) {
				return `@config runtime: unknown runtime '${entry.value}'${formatDidYouMeanSuffix(
					entry.value,
					Object.keys(runtimeRegistry)
				)}`;
			}

			return undefined;
		},
	};
}

export function registerRuntimeEditorConfigValidator(store: StateManager<State>): void {
	store.set('editorConfigValidators.runtime', createRuntimeEditorConfigValidator(store));
}
