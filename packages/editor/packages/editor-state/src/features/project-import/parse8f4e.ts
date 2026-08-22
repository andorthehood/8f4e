import { parseProjectSource } from '@8f4e/compiler';
import type { ProjectObjectModel } from '@8f4e/language-spec';

/**
 * Parses .8f4e text format into the canonical ProjectObjectModel.
 * Throws if the text is not valid .8f4e format.
 */
export function parse8f4eToProject(text: string): ProjectObjectModel {
	return parseProjectSource(text);
}
