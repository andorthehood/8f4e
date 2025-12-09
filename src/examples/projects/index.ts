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
	{ slug: 'audioBuffer', title: 'Audio Buffer', description: '' },
	{ slug: 'audioLoopback', title: 'Audio Loopback', description: '' },
	{ slug: 'bistableMultivibrators', title: 'Bistable Multivibrators', description: '' },
	{
		slug: 'crtEffect',
		title: 'CRT Effect Demo',
		description: 'Demonstrates post-process shader effects with a classic CRT monitor appearance',
	},
	{ slug: 'dancingWithTheSineLT', title: 'Dancing With The Sine LT', description: '' },
	{ slug: 'ericSaiteGenerator', title: 'Eric Saite Generator', description: '' },
	{
		slug: 'functionExample',
		title: 'Function Example',
		description: 'Demonstrates using a helper function to square numbers',
	},
	{ slug: 'midiArpeggiator', title: 'MIDI Arpeggiator', description: '' },
	{ slug: 'midiArpeggiator2', title: 'MIDI Arpeggiator 2', description: '' },
	{ slug: 'midiBreakBeat', title: 'MIDI Break Beat', description: '' },
	{ slug: 'midiBreakBreak2dSequencer', title: 'MIDI Break Break 2D Sequencer', description: '' },
	{ slug: 'neuralNetwork', title: 'Neural Network', description: '' },
	{ slug: 'randomGenerators', title: 'Random Generators', description: '' },
	{ slug: 'randomNoteGenerator', title: 'Random Note Generator', description: '' },
	{
		slug: 'simpleCounterMainThread',
		title: 'Simple Counter (Main Thread)',
		description: 'Demonstrates the MainThreadLogicRuntime',
	},
];

// For backwards compatibility
export default projectManifest;
