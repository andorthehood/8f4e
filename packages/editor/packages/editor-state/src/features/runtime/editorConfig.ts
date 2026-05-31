import type {
	EditorConfigSchemaContributionRegistry,
	EditorConfigValidator,
	RuntimeRegistry,
	RuntimeRegistryEntry,
	State,
} from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import { formatDidYouMeanSuffix } from '../global-editor-directives/suggestions';

export const RUNTIME_SELECTION_CONFIG_PATH = 'runtime';

function isRegisteredRuntimeId(runtimeRegistry: RuntimeRegistry, runtimeId: string): boolean {
	return Object.hasOwn(runtimeRegistry, runtimeId);
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

export function getSelectedRuntimeEntry(
	requestedRuntimeId: string | undefined,
	runtimeRegistry: RuntimeRegistry,
	defaultRuntimeId: string
): RuntimeRegistryEntry {
	const resolvedRuntimeId = resolveSelectedRuntimeId(requestedRuntimeId, runtimeRegistry, defaultRuntimeId);
	return runtimeRegistry[resolvedRuntimeId];
}

export function collectRuntimeEditorConfigSchemaContributions(
	requestedRuntimeId: string | undefined,
	runtimeRegistry: RuntimeRegistry,
	defaultRuntimeId: string
): EditorConfigSchemaContributionRegistry {
	const contributions: EditorConfigSchemaContributionRegistry = {};
	const selectedEntry = getSelectedRuntimeEntry(requestedRuntimeId, runtimeRegistry, defaultRuntimeId);

	if (selectedEntry.editorConfigSchema) {
		contributions[`runtime:${selectedEntry.id}`] = selectedEntry.editorConfigSchema;
	}

	for (const entry of Object.values(runtimeRegistry)) {
		if (entry.id === selectedEntry.id || !entry.editorConfigSchema) {
			continue;
		}
		contributions[`runtime:${entry.id}`] = entry.editorConfigSchema;
	}

	return contributions;
}

export function createRuntimeSelectionEditorConfigValidator(store: StateManager<State>): EditorConfigValidator {
	return {
		get knownPaths() {
			return [RUNTIME_SELECTION_CONFIG_PATH];
		},
		matches: path => path === RUNTIME_SELECTION_CONFIG_PATH,
		validate: entry => {
			const { runtimeRegistry } = store.getState();
			const runtimeIds = Object.keys(runtimeRegistry);

			if (!isRegisteredRuntimeId(runtimeRegistry, entry.value)) {
				return `@config runtime: unknown runtime '${entry.value}'${formatDidYouMeanSuffix(entry.value, runtimeIds)}`;
			}

			return undefined;
		},
		parse: entry => entry.value,
	};
}

export function registerRuntimeSelectionEditorConfigValidator(store: StateManager<State>): void {
	store.set('editorConfigValidators.runtime', createRuntimeSelectionEditorConfigValidator(store));
}
