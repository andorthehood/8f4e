import { EventDispatcher, InternalKeyboardEvent } from '../types';

import type { State } from '../types';

export default function keyboardShortcuts(state: State, events: EventDispatcher): void {
	function onKeydown({ key, metaKey }: InternalKeyboardEvent) {
		// Command/Ctrl + S: Manual save to localStorage
		if (metaKey && key.toLowerCase() === 's') {
			events.dispatch('saveProject');
		}

		if (metaKey && key.toLowerCase() === 'z') {
			events.dispatch('undo');
		}
	}

	events.on<InternalKeyboardEvent>('keydown', onKeydown);
}
