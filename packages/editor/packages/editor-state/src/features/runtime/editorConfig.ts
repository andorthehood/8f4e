import { formatDidYouMeanSuffix } from '../global-editor-directives/suggestions';

import type { EditorConfigValidator, RuntimeRegistry, Runtimes, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';

export const RUNTIME_CONFIG_PATH = 'runtime';

function isRegisteredRuntimeId(runtimeRegistry: RuntimeRegistry, runtimeId: string): boolean {
	return Object.prototype.hasOwnProperty.call(runtimeRegistry, runtimeId);
}

export function resolveSelectedRuntimeId(
	requestedRuntimeId: string | undefined,
	runtimeRegistry: RuntimeRegistry,
	defaultRuntimeId: string
): string {
	if (requestedRuntimeId && isRegisteredRuntimeId(runtimeRegistry, requestedRuntimeId)) {
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
			const runtimeIds = Object.keys(runtimeRegistry);

			if (!isRegisteredRuntimeId(runtimeRegistry, entry.value)) {
				return `@config runtime: unknown runtime '${entry.value}'${formatDidYouMeanSuffix(entry.value, runtimeIds)}`;
			}

			return undefined;
		},
	};
}

export function registerRuntimeEditorConfigValidator(store: StateManager<State>): void {
	store.set('editorConfigValidators.runtime', createRuntimeEditorConfigValidator(store));
}
