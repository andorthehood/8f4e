import { EventDispatcher } from '../../events';

import type { State } from '../types';

export default function colorTheme(state: State, events: EventDispatcher): () => void {
	function onSetColorScheme({ colorScheme }) {
		state.editorSettings.colorScheme = colorScheme;
		events.dispatch('saveState');
	}

	events.on('setColorScheme', onSetColorScheme);

	return () => {
		events.off('setColorScheme', onSetColorScheme);
	};
}
