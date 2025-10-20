import { EventDispatcher } from '../../events';

import type { State } from '../types';

export default function colorTheme(state: State, events: EventDispatcher): () => void {
	function onSetColorScheme({ colorScheme }: { colorScheme: string }) {
		state.editorSettings.colorScheme = colorScheme;
		events.dispatch('saveEditorSettings');
	}

	events.on('setColorScheme', onSetColorScheme);

	return () => {
		events.off('setColorScheme', onSetColorScheme);
	};
}
