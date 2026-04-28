import { registerColorEditorConfigValidator } from './editorConfig';

import type { State } from '~/types';
import type { StateManager } from '@8f4e/state-manager';

export default function color(store: StateManager<State>): void {
	registerColorEditorConfigValidator(store);
}
