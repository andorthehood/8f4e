import type { Project, State } from '@8f4e/editor-state-types';
import convertGraphicDataToProjectStructure from './serializeCodeBlocks';

/**
 * Serializes current runtime state to the JSON-safe Project shape used for session persistence.
 * @param state Current editor state
 * @returns Project object ready for session persistence or `.8f4e` conversion
 */
export default function serializeToProject(state: State): Project {
	const { graphicHelper } = state;

	return convertGraphicDataToProjectStructure(graphicHelper.codeBlocks);
}
