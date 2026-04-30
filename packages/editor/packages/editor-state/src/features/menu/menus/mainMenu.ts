import type { MenuGenerator } from '@8f4e/editor-state-types';

export const mainMenu: MenuGenerator = state => [
	...(state.featureFlags.editing
		? [
				{
					title: 'New Module',
					action: 'addCodeBlock',
					payload: { isNew: true, blockType: 'module' },
					close: true,
				},
				{
					title: 'New Function',
					action: 'addCodeBlock',
					payload: { isNew: true, blockType: 'function' },
					close: true,
				},
				{
					title: 'New Note',
					action: 'addCodeBlock',
					payload: { isNew: true, blockType: 'note' },
					close: true,
				},
				{
					title: 'Paste Module',
					action: 'addCodeBlock',
					payload: { isPaste: true },
					close: true,
					disabled: !state.callbacks.readClipboardText,
				},
				{
					title: 'Add Built-in Module',
					action: 'openSubMenu',
					payload: { menu: 'moduleCategoriesMenu' },
					close: false,
					disabled: !state.callbacks.getListOfModules,
				},
			]
		: []),
	...(state.featureFlags.editing ? [{ divider: true }] : []),
	...(state.featureFlags.editing
		? [
				{
					title: 'Go @home',
					action: 'goHome',
					close: true,
				},
			]
		: []),
	{
		title: 'Jump to...',
		action: 'openSubMenu',
		payload: { menu: 'favoritesMenu' },
		close: false,
	},
	{ divider: true },
	...(state.featureFlags.editing ? [{ title: 'New Project', action: 'new', close: true }, { divider: true }] : []),
	{ title: 'Open From Disk', action: 'importProject', close: true, disabled: !state.callbacks.importProject },
	{
		title: 'Open Project',
		action: 'openSubMenu',
		payload: { menu: 'projectMenu' },
		close: false,
		disabled: !state.callbacks.getListOfProjects,
	},
	{ divider: true },
	{
		title: 'Clear Binary Asset Cache',
		action: 'clearBinaryAssetCache',
		close: true,
		disabled: !state.callbacks.clearBinaryAssetCache,
	},
	{ divider: true },
	{ title: 'Export Project', action: 'exportProject', close: true, disabled: !state.callbacks.exportProject },
	{
		title: 'Export WebAssembly',
		action: 'exportWasm',
		close: true,
		disabled: !state.callbacks.exportBinaryCode,
	},
];
