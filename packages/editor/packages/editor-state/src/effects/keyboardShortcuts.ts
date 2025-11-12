import { EventDispatcher, InternalKeyboardEvent } from '../types';

import type { State } from '../types';

export default function keyboardShortcuts(state: State, events: EventDispatcher): void {
	function onKeydown({ key, metaKey }: InternalKeyboardEvent) {
		if (metaKey && key.toLowerCase() === 's') {
			events.dispatch('saveProject');
		}

		if (metaKey && key.toLowerCase() === 'z') {
			events.dispatch('undo');
		}

		if (metaKey && key.toLowerCase() === 'y') {
			events.dispatch('redo');
		}
	}

	events.on<InternalKeyboardEvent>('keydown', onKeydown);
}
