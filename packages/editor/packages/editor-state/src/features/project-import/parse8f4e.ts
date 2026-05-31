import type { Project } from '@8f4e/editor-state-types';
import { parse8f4eProject } from '@8f4e/tokenizer';

/**
 * Parses .8f4e text format into a Project.
 * Throws if the text is not valid .8f4e format.
 */
export function parse8f4eToProject(text: string): Project {
	return parse8f4eProject(text);
}
