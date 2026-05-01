import { fetchRegistryJson } from './fetchRegistry';

const EXAMPLE_MODULES_REGISTRY_URL = 'https://static.llllllllllll.com/8f4e/example-modules/registry.json';

export interface ExampleModuleRegistryEntry {
	slug: string;
	title: string;
	description?: string;
	category: string;
	dependencies?: string[];
	url: string;
	path: string;
}

interface ExampleModulesRegistry {
	modules: ExampleModuleRegistryEntry[];
}

let moduleRegistryPromise: Promise<ExampleModuleRegistryEntry[]> | null = null;
let moduleManifestPromise: Promise<Record<string, string>> | null = null;

function fetchModuleRegistry(): Promise<ExampleModuleRegistryEntry[]> {
	return fetchRegistryJson<ExampleModulesRegistry>(EXAMPLE_MODULES_REGISTRY_URL).then(registry => registry.modules);
}

export function getExampleModuleRegistry(): Promise<ExampleModuleRegistryEntry[]> {
	moduleRegistryPromise ??= fetchModuleRegistry();
	return moduleRegistryPromise;
}

export function getExampleModuleManifest(): Promise<Record<string, string>> {
	moduleManifestPromise ??= getExampleModuleRegistry().then(modules =>
		Object.fromEntries(modules.map(module => [module.slug, module.url]))
	);
	return moduleManifestPromise;
}
