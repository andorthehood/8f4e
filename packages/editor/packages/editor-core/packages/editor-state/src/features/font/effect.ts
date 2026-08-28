import type { State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import { registerFontEditorConfigValidator } from './editorConfig';

export default function font(store: StateManager<State>): void {
	registerFontEditorConfigValidator(store);
}
