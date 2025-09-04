import { EventDispatcher } from '../../events';

import type { State } from '../types';

export default function font(state: State, events: EventDispatcher): () => void {
	function onSetFont({ font }) {
		state.editorSettings.font = font;
		events.dispatch('saveState');
	}

	events.on('setFont', onSetFont);

	return () => {
		events.off('setFont', onSetFont);
	};
}
