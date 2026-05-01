import type { EditorEnvironmentPluginRegistryEntry } from './types';

export const editorEnvironmentPluginRegistry: EditorEnvironmentPluginRegistryEntry[] = [
	{
		id: 'keyboard-memory',
		editorDirectives: ['keyPressedMemory', 'keyCodeMemory'],
		load: () => import('./keyboardMemory/plugin'),
	},
];
