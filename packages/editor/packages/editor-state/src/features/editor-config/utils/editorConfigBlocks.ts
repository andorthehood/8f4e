import { isConfigBlockOfType, isConfigTypeInCode } from '../../config-compiler/utils/isConfigBlockOfType';

import type { CodeBlockGraphicData, EditorConfigBlock } from '~/types';

export function isEditorConfigBlock(block: CodeBlockGraphicData | null | undefined): boolean {
	return isConfigBlockOfType(block, 'editor');
}

export function isEditorConfigCode(code: string[]): boolean {
	return isConfigTypeInCode(code, 'editor');
}

export function serializeEditorConfigBlocks(codeBlocks: CodeBlockGraphicData[]): EditorConfigBlock[] {
	return codeBlocks
		.filter(block => isEditorConfigBlock(block))
		.map(block => ({
			code: block.code,
			disabled: block.disabled,
			gridCoordinates: {
				x: block.gridX,
				y: block.gridY,
			},
		}));
}

export const DEFAULT_EDITOR_CONFIG_BLOCK: EditorConfigBlock = {
	code: [
		'config editor',
		'; @favorite',
		"; This is a special block that doesn't",
		'; get saved with the project.',
		'',
		'; Available color schemes:',
		'; - redalert',
		'; - hackerman',
		'; - default',
		'scope "colorScheme"',
		'push "redalert"',
		'set',
		'',
		'; Available fonts:',
		'; - 8x16',
		'; - 6x10',
		'rescope "font"',
		'push "8x16"',
		'set',
		'',
		'configEnd',
	],
	disabled: false,
	gridCoordinates: {
		x: 0,
		y: 0,
	},
};
