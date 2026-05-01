import { fetchRegistryJson } from './fetchRegistry';

const EXAMPLE_PROJECTS_REGISTRY_URL = 'https://static.llllllllllll.com/8f4e/example-projects/registry.json';

export interface ExampleProjectRegistryEntry {
	url: string;
	title: string;
	category: string;
	path: string;
}

interface ExampleProjectsRegistry {
	projects: ExampleProjectRegistryEntry[];
}

let projectRegistryPromise: Promise<ExampleProjectRegistryEntry[]> | null = null;

export function getExampleProjectRegistry(): Promise<ExampleProjectRegistryEntry[]> {
	projectRegistryPromise ??= fetchRegistryJson<ExampleProjectsRegistry>(EXAMPLE_PROJECTS_REGISTRY_URL).then(
		registry => registry.projects
	);
	return projectRegistryPromise;
}
