import getBlockType from '../code-blocks/utils/codeParsers/getBlockType';

import type { BrowserLocalNoteStorageBlock, CodeBlockGraphicData } from '@8f4e/editor-state-types';

const BROWSER_LOCAL_NOTE_HEADER_PREFIX = 'note local.';

export function isBrowserLocalNoteCode(code: string[]): boolean {
	return getBlockType(code) === 'note' && (code[0]?.trim() ?? '').startsWith(BROWSER_LOCAL_NOTE_HEADER_PREFIX);
}

export function isBrowserLocalNoteBlock(block: CodeBlockGraphicData | null | undefined): boolean {
	return block ? isBrowserLocalNoteCode(block.code) : false;
}

export function serializeBrowserLocalNotes(codeBlocks: CodeBlockGraphicData[]): BrowserLocalNoteStorageBlock[] {
	return codeBlocks
		.filter(block => isBrowserLocalNoteBlock(block))
		.map(block => ({
			code: block.code,
			disabled: block.disabled,
			gridCoordinates: {
				x: block.gridX,
				y: block.gridY,
			},
		}));
}

export const DEFAULT_BROWSER_LOCAL_NOTE: BrowserLocalNoteStorageBlock = {
	code: [
		'note local.editorConfig',
		'; @favorite',
		"; This is a special note that doesn't",
		'; get saved with the project.',
		'',
		'; Default editor font:',
		'; @config font ibmvga8x16',
		'noteEnd',
	],
	disabled: false,
	gridCoordinates: {
		x: 0,
		y: 0,
	},
};
