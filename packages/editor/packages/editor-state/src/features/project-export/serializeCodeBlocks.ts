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

function cloneProjectStructure(project: ProjectObjectModel): ProjectObjectModel {
	return {
		...createEmptyProject({
			...(project.id ? { id: project.id } : {}),
			...(project.name ? { name: project.name } : {}),
			...(project.entry ? { entry: project.entry } : {}),
		}),
		groups: project.groups.map(cloneProjectStructure),
	};
}

function getProjectForPath(
	rootProject: ProjectObjectModel,
	subProgramPath: CodeBlockGraphicData['subProgramPath']
): ProjectObjectModel {
	let project = rootProject;
	for (const segment of subProgramPath ?? []) {
		let group = project.groups.find(candidate =>
			segment.id ? candidate.id === segment.id : candidate.name === segment.name && candidate.entry === segment.entry
		);
		if (!group) {
			group = createEmptyProject({
				...(segment.id ? { id: segment.id } : {}),
				...(segment.name ? { name: segment.name } : {}),
				...(segment.entry ? { entry: segment.entry } : {}),
			});
			project.groups.push(group);
		}
		project = group;
	}
	return project;
}

/** Converts editor-owned live blocks directly into the canonical project collections. */
export default function convertGraphicDataToProjectStructure(
	codeBlocks: CodeBlockGraphicData[],
	projectStructure?: ProjectObjectModel
): ProjectObjectModel {
	const project = projectStructure ? cloneProjectStructure(projectStructure) : createEmptyProject();

	for (const codeBlock of sortCodeBlocksByGridPosition(codeBlocks.filter(block => !isBrowserLocalNoteBlock(block)))) {
		const owningProject = getProjectForPath(project, codeBlock.subProgramPath);
		const block: ProjectBlock = {
			id: codeBlock.creationIndex,
			code: codeBlock.code,
			...(codeBlock.disabled ? { disabled: true } : {}),
		};

		if (codeBlock.blockType === 'module') {
			if (!codeBlock.entry) throw new Error(`Module code block "${codeBlock.name}" is missing an entry`);
			owningProject.modules.push({ ...block, entry: codeBlock.entry });
		} else if (codeBlock.blockType === 'function') {
			owningProject.functions.push(block);
		} else if (codeBlock.blockType === 'constants') {
			owningProject.constants.push(block);
		} else if (codeBlock.blockType === 'prototype') {
			owningProject.prototypes.push(block);
		} else if (codeBlock.blockType === 'includes') {
			owningProject.includes.push(block);
		} else if (codeBlock.blockType === 'note') {
			owningProject.notes.push(block);
		} else {
			owningProject.unknown.push(block);
		}
	}

	return project;
}
