import { getExampleProjectMetadata } from './exampleProjects';

import type { ProjectMetadata } from '@8f4e/editor-state';

/**
 * Get list of projects with metadata only.
 * Returns hosted registry metadata without loading any project code.
 */
export async function getListOfProjects(): Promise<ProjectMetadata[]> {
	return getExampleProjectMetadata();
}

export async function getDefaultProjectUrl(): Promise<string | null> {
	const projectMetadata = await getExampleProjectMetadata();
	return projectMetadata.length > 0 ? projectMetadata[0].url : null;
}

/**
 * Get specific project by URL with forced cache bypass.
 */
export async function getProject(url: string): Promise<string> {
	console.log(`Loading project: ${url}`);
	const requestUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
	const response = await fetch(requestUrl, { cache: 'no-store' });
	if (!response.ok) {
		throw new Error(`Failed to fetch project from ${requestUrl}: HTTP ${response.status}`);
	}
	const text = await response.text();
	console.log(`Loaded project: ${url}`);

	return text;
}
