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
	{ slug: 'audioBuffer', title: 'Audio Buffer', description: '', category: 'Audio' },
	{ slug: 'audioLoopback', title: 'Audio Loopback', description: '', category: 'Audio' },
	{ slug: 'bistableMultivibrators', title: 'Bistable Multivibrators', description: '', category: 'Circuits' },
	{
		slug: 'crtEffect',
		title: 'CRT Effect Demo',
		description: 'Demonstrates post-process shader effects with a classic CRT monitor appearance',
		category: 'Visual/Effects',
	},
	{ slug: 'dancingWithTheSineLT', title: 'Dancing With The Sine LT', description: '', category: 'Visual/Demos' },
	{ slug: 'ericSaiteGenerator', title: 'Eric Saite Generator', description: '', category: 'Audio/Generative' },
	{ slug: 'midiArpeggiator', title: 'MIDI Arpeggiator', description: '', category: 'MIDI/Instruments' },
	{ slug: 'midiArpeggiator2', title: 'MIDI Arpeggiator 2', description: '', category: 'MIDI/Instruments' },
	{ slug: 'midiBreakBeat', title: 'MIDI Break Beat', description: '', category: 'MIDI/Rhythm' },
	{
		slug: 'midiBreakBreak2dSequencer',
		title: 'MIDI Break Break 2D Sequencer',
		description: '',
		category: 'MIDI/Rhythm',
	},
	{ slug: 'neuralNetwork', title: 'Neural Network', description: '', category: 'Machine Learning' },
	{ slug: 'randomGenerators', title: 'Random Generators', description: '', category: 'Utilities' },
	{ slug: 'randomNoteGenerator', title: 'Random Note Generator', description: '', category: 'MIDI/Generative' },
	{
		slug: 'simpleCounterMainThread',
		title: 'Simple Counter (Main Thread)',
		description: 'Demonstrates the MainThreadLogicRuntime',
		category: 'Examples/Runtime',
	},
];

// For backwards compatibility
export default projectManifest;
