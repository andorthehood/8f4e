import type { Project } from '@8f4e/editor-state-types';
import { parseProjectSource } from '@8f4e/project-preparser';

/**
 * Parses .8f4e text format into a Project.
 * Throws if the text is not valid .8f4e format.
 */
export function parse8f4eToProject(text: string): Project {
	return parseProjectSource(text);
}
