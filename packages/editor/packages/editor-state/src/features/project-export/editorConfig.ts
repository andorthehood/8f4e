import type { EditorConfigValidator } from '../editor-config/types';
import type { State } from '~/types';
import type { StateManager } from '@8f4e/state-manager';

export const EXPORT_FILE_NAME_CONFIG_PATH = 'export.fileName';

export const exportFileNameEditorConfigValidator: EditorConfigValidator = {
	knownPaths: [EXPORT_FILE_NAME_CONFIG_PATH],
	matches: path => path === EXPORT_FILE_NAME_CONFIG_PATH,
	validate: entry =>
		entry.value.length > 0 ? undefined : `@config ${EXPORT_FILE_NAME_CONFIG_PATH}: file name must be non-empty`,
};

export function registerExportFileNameEditorConfigValidator(store: StateManager<State>): void {
	store.set('editorConfigValidators.exportFileName', exportFileNameEditorConfigValidator);
}
