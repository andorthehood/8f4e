import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import type { ProjectBlock, ProjectObjectModel } from '@8f4e/language-spec';
import { isBrowserLocalNoteBlock } from '../browser-local-notes/browserLocalNotes';
import sortCodeBlocksByGridPosition from '../code-blocks/sortCodeBlocksByGridPosition';

function createEmptyProject(metadata: Pick<ProjectObjectModel, 'id' | 'name' | 'entry'> = {}): ProjectObjectModel {
	return {
		...metadata,
		modules: [],
		functions: [],
		constants: [],
		prototypes: [],
		includes: [],
		notes: [],
		unknown: [],
		groups: [],
	};
}

/** Converts editor-owned live blocks directly into the canonical project collections. */
export default function convertGraphicDataToProjectStructure(
	codeBlocks: CodeBlockGraphicData[],
	projectStructure?: ProjectObjectModel
): ProjectObjectModel {
	const project = createEmptyProject(
		projectStructure
			? {
					...(projectStructure.id ? { id: projectStructure.id } : {}),
					...(projectStructure.name ? { name: projectStructure.name } : {}),
					...(projectStructure.entry ? { entry: projectStructure.entry } : {}),
				}
			: {}
	);

	for (const codeBlock of sortCodeBlocksByGridPosition(codeBlocks.filter(block => !isBrowserLocalNoteBlock(block)))) {
		if (codeBlock.nestedProjectCodeBlocks !== undefined) {
			project.groups.push(
				convertGraphicDataToProjectStructure(
					codeBlock.nestedProjectCodeBlocks,
					createEmptyProject({
						...(codeBlock.projectGroupId ? { id: codeBlock.projectGroupId } : {}),
						name: codeBlock.name,
						...(codeBlock.entry ? { entry: codeBlock.entry } : {}),
					})
				)
			);
			continue;
		}

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
