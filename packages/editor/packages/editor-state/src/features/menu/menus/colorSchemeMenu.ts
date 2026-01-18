import type { MenuGenerator } from '~/types';

export const colorSchemeMenu: MenuGenerator = state => {
	return state.colorSchemes.map((key: string) => ({
		title: key,
		selector: 'editorSettings.colorScheme',
		value: key,
		close: false,
	}));
};
