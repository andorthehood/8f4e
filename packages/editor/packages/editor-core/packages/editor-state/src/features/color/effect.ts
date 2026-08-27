import type { State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import { registerColorEditorConfigValidator } from './editorConfig';

export default function color(store: StateManager<State>): void {
	registerColorEditorConfigValidator(store);
}
