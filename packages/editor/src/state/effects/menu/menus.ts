import { ContextMenuItem } from '../../types';

export const mainMenu: ContextMenuItem[] = [
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
	{
		title: 'Theme',
		action: 'openSubMenu',
		payload: { menu: 'colorSchemeMenu' },
		close: false,
	},
	{ title: 'Undo', action: 'undo', close: true },
	{ title: 'Export', action: 'save', close: true },
	{ title: 'New', action: 'new', close: true },
	{ title: 'Open', action: 'open', close: true },
];

export const moduleMenu: ContextMenuItem[] = [
	{ title: 'Delete module', action: 'deleteModule', payload: { module }, close: true },
	{ title: 'Copy module', action: 'copyModule', payload: { module }, close: true },
];

export const sampleRateMenu: ContextMenuItem[] = [
	{ title: '44100', action: 'setSampleRate', payload: { sampleRate: 44100 }, close: true },
	{ title: '22050', action: 'setSampleRate', payload: { sampleRate: 22050 }, close: true },
	{ title: '11025', action: 'setSampleRate', payload: { sampleRate: 11025 }, close: true },
];

export const colorSchemeMenu: ContextMenuItem[] = [
	{ title: 'Hackerman', action: 'setColorScheme', payload: { colorScheme: 'hackerman' }, close: true },
    { title: 'Red Alert', action: 'setColorScheme', payload: { colorScheme: 'redalert' }, close: true },
	{ title: 'Default', action: 'setColorScheme', payload: { colorScheme: 'default' }, close: true },
];
