import type { MenuGenerator } from '../../../types';

export const editorSettingsMenu: MenuGenerator = state => [
	{
		title: 'Theme',
		action: 'openSubMenu',
		payload: { menu: 'colorSchemeMenu' },
		close: false,
		disabled: Object.keys(state.colorSchemes).length === 0,
	},
	{
		title: 'Font',
		action: 'openSubMenu',
		payload: { menu: 'fontMenu' },
		close: false,
	},
];
