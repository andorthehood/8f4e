import { ContextMenu } from '@8f4e/editor-state';

export default function generateContextMenuMock(): ContextMenu {
	return {
		highlightedItem: Infinity,
		itemWidth: 248,
		items: [
			{
				title: '.................... New Module',
				action: 'addCodeBlock',
				payload: {
					isNew: true,
				},
				close: true,
			},
			{
				title: '.................. Paste Module',
				action: 'addCodeBlock',
				payload: {
					isPaste: true,
				},
				close: true,
			},
			{
				title: '......... Add Built-in Module >',
				action: 'openSubMenu',
				payload: {
					menu: 'moduleCategoriesMenu',
				},
				close: false,
				disabled: false,
			},
			{
				divider: true,
			},
			{
				title: '........... Import binary asset',
				action: 'importBinaryAsset',
				close: true,
				disabled: false,
			},
			{
				title: '............... Binary assets >',
				action: 'openSubMenu',
				payload: {
					menu: 'binaryAssetsMenu',
				},
				close: false,
			},
			{
				divider: true,
			},
			{
				title: '................... New Project',
				action: 'new',
				close: true,
			},
			{
				divider: true,
			},
			{
				title: '................ Open From Disk',
				action: 'open',
				close: true,
				disabled: false,
			},
			{
				title: '................ Open Project >',
				action: 'openSubMenu',
				payload: {
					menu: 'projectMenu',
				},
				close: false,
				disabled: false,
			},
			{
				divider: true,
			},
			{
				title: '................ Export Project',
				action: 'exportProject',
				close: true,
				disabled: false,
			},
			{
				title: '.. Export Runtime-Ready Project',
				action: 'exportRuntimeReadyProject',
				close: true,
				disabled: false,
			},
			{
				title: '............ Export WebAssembly',
				action: 'exportWasm',
				close: true,
				disabled: false,
			},
			{
				divider: true,
			},
			{
				title: '............. Editor Settings >',
				action: 'openSubMenu',
				payload: {
					menu: 'editorSettingsMenu',
				},
				close: false,
			},
			{
				divider: true,
			},
			{
				title: '................... MIDI Info >',
				action: 'openSubMenu',
				payload: {
					menu: 'midiInfoMenu',
				},
				close: false,
			},
		],
		open: true,
		x: 552,
		y: 256,
		menuStack: [],
	};
}
