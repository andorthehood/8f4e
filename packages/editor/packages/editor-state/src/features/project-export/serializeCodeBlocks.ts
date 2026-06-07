import type { CodeBlockGraphicData, Project } from '@8f4e/editor-state-types';
import { isBrowserLocalNoteBlock } from '../browser-local-notes/browserLocalNotes';
import sortCodeBlocksByGridPosition from '../code-blocks/sortCodeBlocksByGridPosition';

/**
 * Converts graphic data code blocks to simplified project structure for serialization.
 * Code block order is derived from graphic data grid coordinates.
 * Position is stored in @pos directive within code, not in separate gridCoordinates field.
 * Disabled state is stored in @disabled directive within code, not in separate disabled field.
 * Excludes browser-local notes from the exported project.
 * @param codeBlocks Array of code blocks with full graphic data
 * @returns Project suitable for JSON persistence and file export
 */
export default function convertGraphicDataToProjectStructure(codeBlocks: CodeBlockGraphicData[]): Project {
	return {
		codeBlocks: sortCodeBlocksByGridPosition(codeBlocks.filter(block => !isBrowserLocalNoteBlock(block))).map(
			codeBlock => {
				if (codeBlock.blockType === 'module' && !codeBlock.entry) {
					throw new Error(`Module code block "${codeBlock.name}" is missing an entry`);
				}

				return {
					code: codeBlock.code,
					...(codeBlock.blockType === 'module' ? { entry: codeBlock.entry } : {}),
				};
			}
		),
	};
}
