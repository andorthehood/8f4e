import { registerFontEditorConfigValidator } from './editorConfig';

import type { State } from '~/types';
import type { StateManager } from '@8f4e/state-manager';

export default function font(store: StateManager<State>): void {
	registerFontEditorConfigValidator(store);
}
