import keyboardMemoryEvents from '../../events/keyboardMemoryEvents';

import type { EditorEnvironmentPlugin } from '../types';

const keyboardMemoryPlugin: EditorEnvironmentPlugin = {
	start: ({ store, window }) => keyboardMemoryEvents(store, window),
};

export default keyboardMemoryPlugin;
