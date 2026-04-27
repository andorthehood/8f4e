import { getModuleId } from '@8f4e/tokenizer';

import type { CodeBlockGraphicData } from '~/types';

export interface EditorConfigStorageBlock {
	code: string[];
	disabled?: boolean;
	gridCoordinates?: {
		x: number;
		y: number;
	};
}

const EDITOR_CONFIG_MODULE_ID = 'editorConfig';

export function isEditorConfigBlock(block: CodeBlockGraphicData | null | undefined): boolean {
	if (!block) {
		return false;
	}

	return getModuleId(block.code) === EDITOR_CONFIG_MODULE_ID;
}

export function isEditorConfigCode(code: string[]): boolean {
	return getModuleId(code) === EDITOR_CONFIG_MODULE_ID;
}

export function serializeEditorConfigBlocks(codeBlocks: CodeBlockGraphicData[]): EditorConfigStorageBlock[] {
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

export const DEFAULT_EDITOR_CONFIG_BLOCK: EditorConfigStorageBlock = {
	code: [
		'module editorConfig',
		'; @favorite',
		"; This is a special block that doesn't",
		'; get saved with the project.',
		'',
		'; Default editor font:',
		'; @config font ibmvga8x16',
		'moduleEnd',
	],
	disabled: false,
	gridCoordinates: {
		x: 0,
		y: 0,
	},
};
