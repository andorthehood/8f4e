import type { Project, ProjectMetadata } from '@8f4e/editor-state';

/**
 * Manifest of available projects with their lazy loaders.
 * Maps slug -> loader function.
 */
export const projectManifest: Record<string, () => Promise<Project>> = {
	audioBuffer: () => import('@8f4e/examples/projects/audioBuffer').then(m => m.default),
	audioLoopback: () => import('@8f4e/examples/projects/audioLoopback').then(m => m.default),
	backgroundPlasma: () => import('@8f4e/examples/projects/backgroundPlasma').then(m => m.default),
	bistableMultivibrators: () => import('@8f4e/examples/projects/bistableMultivibrators').then(m => m.default),
	dancingWithTheSineLT: () => import('@8f4e/examples/projects/dancingWithTheSineLT').then(m => m.default),
	neuralNetwork: () => import('@8f4e/examples/projects/neuralNetwork').then(m => m.default),
	randomGenerators: () => import('@8f4e/examples/projects/randomGenerators').then(m => m.default),
	rippleEffect: () => import('@8f4e/examples/projects/rippleEffect').then(m => m.default),
	samplePlayer: () => import('@8f4e/examples/projects/samplePlayer').then(m => m.default),
	simpleCounterMainThread: () => import('@8f4e/examples/projects/simpleCounterMainThread').then(m => m.default),
	standaloneProject: () => import('@8f4e/examples/projects/standaloneProject').then(m => m.default),
	digitClassifier: () => import('@8f4e/examples/projects/digitClassifier').then(m => m.default),
};

/**
 * Hardcoded metadata for all projects.
 * This allows listing projects without loading their code.
 * Metadata is kept in sync with actual project files.
 */
export const projectMetadata: ProjectMetadata[] = [
	{ slug: 'audioBuffer', title: 'Audio Buffer', category: 'Audio' },
	{ slug: 'audioLoopback', title: 'Audio Loopback', category: 'Audio' },
	{ slug: 'backgroundPlasma', title: 'Background Plasma', category: 'Visuals' },
	{ slug: 'bistableMultivibrators', title: 'Bistable Multivibrators', category: 'Digital' },
	{ slug: 'dancingWithTheSineLT', title: 'Dancing With The Sine LT', category: 'Visuals' },
	{ slug: 'neuralNetwork', title: 'Neural Network', category: 'Machine Learning' },
	{ slug: 'randomGenerators', title: 'Random Generators', category: 'Misc' },
	{
		slug: 'rippleEffect',
		title: 'Ripple Effect Demo',
		category: 'Visuals',
	},
	{ slug: 'samplePlayer', title: 'Sample Player', category: 'Audio' },
	{
		slug: 'simpleCounterMainThread',
		title: 'Simple Counter (Main Thread)',
		category: 'Misc',
	},
	{ slug: 'standaloneProject', title: 'Standalone Project Example', category: 'Misc' },
	{ slug: 'digitClassifier', title: 'Digit Classifier', category: 'Machine Learning' },
];

// For backwards compatibility
export default projectManifest;
