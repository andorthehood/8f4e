import type { EditorEnvironmentPluginRegistryEntry } from './types';

export const editorEnvironmentPluginRegistry: EditorEnvironmentPluginRegistryEntry[] = [
	{
		id: 'keyboard-memory',
		editorDirectives: ['keyPressedMemory', 'keyCodeMemory'],
		load: () => import('./keyboardMemory/plugin'),
	},
	{
		id: 'binary-assets',
		editorDirectives: ['defAsset', 'loadAsset'],
		load: () => import('./binaryAssets/plugin'),
	},
	{
		id: 'midi',
		editorDirectives: ['midiIn', 'info'],
		matchesDirective: directive =>
			directive.prefix === '@' &&
			(directive.name === 'midiIn' || (directive.name === 'info' && directive.args[0] === 'midi')),
		load: () => import('./midi/plugin'),
	},
];
