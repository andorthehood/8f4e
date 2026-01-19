import type { Project, ProjectMetadata } from '@8f4e/editor-state';

/**
 * Lazy project loaders using Vite's import.meta.glob.
 * Each loader returns a Promise that resolves to the project's default export.
 * This prevents bundling project code until it's actually requested.
 */
const projectLoaders = import.meta.glob<Project>('./*.ts', {
	eager: false,
	import: 'default',
});

/**
 * Extracts the project slug from the file path.
 * Example: "./audioBuffer.ts" -> "audioBuffer"
 */
function getSlugFromPath(path: string): string {
	return path.replace(/^\.\//, '').replace(/\.ts$/, '');
}

/**
 * Manifest of available projects with their lazy loaders.
 * Maps slug -> loader function.
 */
export const projectManifest: Record<string, () => Promise<Project>> = Object.fromEntries(
	Object.entries(projectLoaders).map(([path, loader]) => [getSlugFromPath(path), loader])
);

/**
 * Hardcoded metadata for all projects.
 * This allows listing projects without loading their code.
 * Metadata is kept in sync with actual project files.
 */
export const projectMetadata: ProjectMetadata[] = [
	{ slug: 'audioBuffer', title: 'Audio Buffer', category: 'Audio' },
	{ slug: 'audioLoopback', title: 'Audio Loopback', category: 'Audio' },
	{ slug: 'bistableMultivibrators', title: 'Bistable Multivibrators', category: 'Digital' },
	{
		slug: 'rippleEffect',
		title: 'Ripple Effect Demo',
		category: 'Visuals',
	},
	{ slug: 'dancingWithTheSineLT', title: 'Dancing With The Sine LT', category: 'Visuals' },
	{ slug: 'neuralNetwork', title: 'Neural Network', category: 'Machine Learning' },
	{ slug: 'randomGenerators', title: 'Random Generators', category: 'Misc' },
	{
		slug: 'simpleCounterMainThread',
		title: 'Simple Counter (Main Thread)',
		category: 'Misc',
	},
	{ slug: 'standaloneProject', title: 'Standalone Project Example', category: 'Misc' },
];

// For backwards compatibility
export default projectManifest;
