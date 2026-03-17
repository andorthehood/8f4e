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
