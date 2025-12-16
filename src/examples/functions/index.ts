import type { ExampleModule, ModuleMetadata } from '@8f4e/editor-state';

/**
 * Lazy module loaders using Vite's import.meta.glob.
 * Each loader returns a Promise that resolves to the module's default export.
 * This prevents bundling module code until it's actually requested.
 */
const moduleLoaders = import.meta.glob<ExampleModule>('./*.ts', {
	eager: false,
	import: 'default',
});

/**
 * Extracts the module slug from the file path.
 * Example: "./audioBufferOut.ts" -> "audioBufferOut"
 */
function getSlugFromPath(path: string): string {
	return path.replace(/^\.\//, '').replace(/\.ts$/, '');
}

/**
 * Manifest of available modules with their lazy loaders.
 * Maps slug -> loader function.
 */
export const moduleManifest: Record<string, () => Promise<ExampleModule>> = Object.fromEntries(
	Object.entries(moduleLoaders).map(([path, loader]) => [getSlugFromPath(path), loader])
);

/**
 * Hardcoded metadata for all modules.
 * This allows listing modules without loading their heavy code payloads.
 * Metadata is kept in sync with actual module files.
 */
export const moduleMetadata: ModuleMetadata[] = [
	{ slug: 'sine', title: 'Sine [-PI, PI] (Polynomial Approximation)', category: 'Functions' },
];

// For backwards compatibility, export a default object that matches the old API
// but note: accessing properties will not trigger loading - use the registry functions instead
export default moduleManifest;
