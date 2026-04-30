import { fetchRegistryJson } from './fetchRegistry';

import type { ProjectMetadata } from '@8f4e/editor-state-types';

const EXAMPLE_PROJECTS_REGISTRY_URL = 'https://static.llllllllllll.com/8f4e/example-projects/registry.json';

export type ExampleProjectMetadata = ProjectMetadata & { path: string };

interface ExampleProjectsRegistry {
	projects: ExampleProjectMetadata[];
}

let projectMetadataPromise: Promise<ExampleProjectMetadata[]> | null = null;

export function getExampleProjectMetadata(): Promise<ExampleProjectMetadata[]> {
	projectMetadataPromise ??= fetchRegistryJson<ExampleProjectsRegistry>(EXAMPLE_PROJECTS_REGISTRY_URL).then(
		registry => registry.projects
	);
	return projectMetadataPromise;
}
