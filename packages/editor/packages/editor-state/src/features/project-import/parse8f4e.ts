import type { Project } from '@8f4e/editor-state-types';
import type { Parse8f4eProjectAsyncOptions, Parse8f4eProjectOptions } from '@8f4e/tokenizer';
import { parse8f4eProject, parse8f4eProjectAsync } from '@8f4e/tokenizer';

/**
 * Parses .8f4e text format into a Project.
 * Throws if the text is not valid .8f4e format.
 */
export function parse8f4eToProject(text: string, options?: Parse8f4eProjectOptions): Project {
	return parse8f4eProject(text, options);
}

export async function parse8f4eToProjectAsync(text: string, options?: Parse8f4eProjectAsyncOptions): Promise<Project> {
	return parse8f4eProjectAsync(text, options);
}
