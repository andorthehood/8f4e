import { fetchRegistryJson } from './fetchRegistry';

import type { ModuleMetadata } from '@8f4e/editor-state-types';

const EXAMPLE_MODULES_REGISTRY_URL = 'https://static.llllllllllll.com/8f4e/example-modules/registry.json';

export type ExampleModuleMetadata = ModuleMetadata & { url: string; path: string };

interface ExampleModulesRegistry {
	modules: ExampleModuleMetadata[];
}

let moduleMetadataPromise: Promise<ExampleModuleMetadata[]> | null = null;
let moduleManifestPromise: Promise<Record<string, string>> | null = null;

function fetchModuleMetadata(): Promise<ExampleModuleMetadata[]> {
	return fetchRegistryJson<ExampleModulesRegistry>(EXAMPLE_MODULES_REGISTRY_URL).then(registry => registry.modules);
}

export function getExampleModuleMetadata(): Promise<ExampleModuleMetadata[]> {
	moduleMetadataPromise ??= fetchModuleMetadata();
	return moduleMetadataPromise;
}

export function getExampleModuleManifest(): Promise<Record<string, string>> {
	moduleManifestPromise ??= getExampleModuleMetadata().then(metadata =>
		Object.fromEntries(metadata.map(module => [module.slug, module.url]))
	);
	return moduleManifestPromise;
}
