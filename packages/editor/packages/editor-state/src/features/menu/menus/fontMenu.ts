import type { MenuGenerator } from '../../../types';

export const fontMenu: MenuGenerator = () => [
	{ title: '8x16', selector: 'editorSettings.font', value: '8x16', close: false },
	{ title: '6x10', selector: 'editorSettings.font', value: '6x10', close: false },
];
