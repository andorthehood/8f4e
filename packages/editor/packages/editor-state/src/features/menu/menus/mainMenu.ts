import type { MenuGenerator } from '~/types';

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
					title: 'New Vertex Shader',
					action: 'addCodeBlock',
					payload: { isNew: true, blockType: 'vertexShader' },
					close: true,
				},
				{
					title: 'New Fragment Shader',
					action: 'addCodeBlock',
					payload: { isNew: true, blockType: 'fragmentShader' },
					close: true,
				},
				{
					title: 'New Comment',
					action: 'addCodeBlock',
					payload: { isNew: true, blockType: 'comment' },
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
		title: 'Compile Config',
		action: 'compileConfig',
		close: true,
		disabled: !state.callbacks.compileConfig,
	},
	{
		title: 'Compile Code',
		action: 'compileCode',
		close: true,
		disabled: !state.callbacks.compileCode,
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
		title: 'Export Runtime-Ready Project',
		action: 'exportRuntimeReadyProject',
		close: true,
		disabled: !state.callbacks.exportProject,
	},
	{
		title: 'Export WebAssembly',
		action: 'exportWasm',
		close: true,
		disabled: !state.callbacks.exportBinaryCode,
	},
	{ divider: true },
	{ title: 'MIDI Info', action: 'openSubMenu', payload: { menu: 'midiInfoMenu' }, close: false },
];
