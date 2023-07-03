import { MenuGenerator } from '../../types';
import bistableMultivibratorProject from '../../../exampleProjects/bistableMultivibrator.json';
import audioBufferProject from '../../../exampleProjects/audioBuffer.json';
export const mainMenu: MenuGenerator = () => [
	{
		title: 'New Module',
		action: 'addModule',
		payload: { isNew: true },
		close: true,
	},
	{
		title: 'Paste Module',
		action: 'addModule',
		payload: { isPaste: true },
		close: true,
	},
	{ divider: true },
	{ title: 'New Project', action: 'new', close: true },
	{ divider: true },
	{ title: 'Open From Disk', action: 'open', close: true },
	{ title: 'Open Example Project', action: 'openSubMenu', payload: { menu: 'exampleProjectMenu' }, close: false },
	{ divider: true },
	{ title: 'Export Project', action: 'save', close: true },
	{ divider: true },
	{ title: 'Editor Settings', action: 'openSubMenu', payload: { menu: 'editorSettingsMenu' }, close: false },
	{ title: 'Project Settings', action: 'openSubMenu', payload: { menu: 'projectSettingsMenu' }, close: false },
	{ divider: true },
];

export const moduleMenu: MenuGenerator = state => [
	{ title: 'Delete module', action: 'deleteModule', payload: { module: state.selectedModule }, close: true },
	{ title: 'Copy module', action: 'copyModule', payload: { module: state.selectedModule }, close: true },
];

export const sampleRateMenu: MenuGenerator = () => [
	{ title: '44100', action: 'setSampleRate', payload: { sampleRate: 44100 }, close: true },
	{ title: '22050', action: 'setSampleRate', payload: { sampleRate: 22050 }, close: true },
	{ title: '11025', action: 'setSampleRate', payload: { sampleRate: 11025 }, close: true },
];

export const projectSettingsMenu: MenuGenerator = () => [
	{
		title: 'Import RNBO patch',
		action: 'importRNBOPatch',
		close: true,
	},
	{
		title: 'Remove RNBO patches',
		action: 'removeRNBOPatches',
		close: true,
	},
	{ title: 'Set Sample Rate', action: 'openSubMenu', payload: { menu: 'sampleRateMenu ' }, close: false },
];

export const editorSettingsMenu: MenuGenerator = () => [
	{
		title: 'Theme',
		action: 'openSubMenu',
		payload: { menu: 'colorSchemeMenu' },
		close: false,
	},
];

export const colorSchemeMenu: MenuGenerator = () => [
	{ title: 'Hackerman', action: 'setColorScheme', payload: { colorScheme: 'hackerman' }, close: true },
	{ title: 'Red Alert', action: 'setColorScheme', payload: { colorScheme: 'redalert' }, close: true },
	{ title: 'Default', action: 'setColorScheme', payload: { colorScheme: 'default' }, close: true },
];

export const exampleProjectMenu: MenuGenerator = () => [
	{
		title: 'Bistable Multivibrator',
		action: 'loadProject',
		payload: { project: bistableMultivibratorProject },
		close: true,
	},
	{ title: 'Audio Buffer', action: 'loadProject', payload: { project: audioBufferProject }, close: true },
];
