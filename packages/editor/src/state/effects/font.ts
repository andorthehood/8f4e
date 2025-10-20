import { EventDispatcher } from '../../events';

import type { State } from '../types';
import type { Font } from '@8f4e/sprite-generator';

export default function font(state: State, events: EventDispatcher): () => void {
	function onSetFont({ font }: { font: Font }) {
		state.editorSettings.font = font;
		events.dispatch('saveEditorSettings');
	}

	events.on('setFont', onSetFont);

	return () => {
		events.off('setFont', onSetFont);
	};
}
