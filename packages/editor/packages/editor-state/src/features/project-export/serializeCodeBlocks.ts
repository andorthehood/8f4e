import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import type { ProjectBlock, ProjectObjectModel } from '@8f4e/language-spec';
import { isBrowserLocalNoteBlock } from '../browser-local-notes/browserLocalNotes';
import sortCodeBlocksByGridPosition from '../code-blocks/sortCodeBlocksByGridPosition';

/** Converts editor-owned live blocks directly into the canonical project collections. */
export default function convertGraphicDataToProjectStructure(codeBlocks: CodeBlockGraphicData[]): ProjectObjectModel {
	const project: ProjectObjectModel = {
		modules: [],
		functions: [],
		constants: [],
		prototypes: [],
		includes: [],
		notes: [],
		unknown: [],
		groups: [],
	};

	for (const codeBlock of sortCodeBlocksByGridPosition(codeBlocks.filter(block => !isBrowserLocalNoteBlock(block)))) {
		const block: ProjectBlock = {
			id: codeBlock.creationIndex,
			code: codeBlock.code,
			...(codeBlock.disabled ? { disabled: true } : {}),
		};

		if (codeBlock.blockType === 'module') {
			if (!codeBlock.entry) throw new Error(`Module code block "${codeBlock.name}" is missing an entry`);
			project.modules.push({ ...block, entry: codeBlock.entry });
		} else if (codeBlock.blockType === 'function') {
			project.functions.push(block);
		} else if (codeBlock.blockType === 'constants') {
			project.constants.push(block);
		} else if (codeBlock.blockType === 'prototype') {
			project.prototypes.push(block);
		} else if (codeBlock.blockType === 'includes') {
			project.includes.push(block);
		} else if (codeBlock.blockType === 'note') {
			project.notes.push(block);
		} else {
			project.unknown.push(block);
		}
	}

	return project;
}
