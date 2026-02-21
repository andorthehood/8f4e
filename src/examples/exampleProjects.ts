import type { ProjectMetadata } from '@8f4e/editor-state';

/**
 * Base URL where example project .8f4e files are hosted.
 */
const DEFAULT_EXAMPLE_PROJECTS_BASE_URL = 'https://static.llllllllllll.com/8f4e/example-projects';
const exampleProjectsBaseUrl = DEFAULT_EXAMPLE_PROJECTS_BASE_URL.replace(/\/$/, '');

export type ExampleProjectMetadata = ProjectMetadata & { url: string };

/**
 * Hardcoded metadata for all projects.
 * This allows listing projects without loading their code.
 * Metadata is kept in sync with actual project files.
 */
export const projectMetadata: ExampleProjectMetadata[] = [
	{
		title: 'Audio Buffer',
		category: 'Audio',
		url: `${exampleProjectsBaseUrl}/audioBuffer.8f4e`,
	},
	{
		title: 'Audio Loopback',
		category: 'Audio',
		url: `${exampleProjectsBaseUrl}/audioLoopback.8f4e`,
	},
	{
		title: 'Background Plasma',
		category: 'Visuals',
		url: `${exampleProjectsBaseUrl}/backgroundPlasma.8f4e`,
	},
	{
		title: 'Bistable Multivibrators',
		category: 'Digital',
		url: `${exampleProjectsBaseUrl}/bistableMultivibrators.8f4e`,
	},
	{
		title: 'Dancing With The Sine LT',
		category: 'Visuals',
		url: `${exampleProjectsBaseUrl}/dancingWithTheSineLT.8f4e`,
	},
	{
		title: 'XOR Problem',
		category: 'Machine Learning',
		url: `${exampleProjectsBaseUrl}/xorProblem.8f4e`,
	},
	{
		title: 'Random Generators',
		category: 'Misc',
		url: `${exampleProjectsBaseUrl}/randomGenerators.8f4e`,
	},
	{
		title: 'Ripple Effect Demo',
		category: 'Visuals',
		url: `${exampleProjectsBaseUrl}/rippleEffect.8f4e`,
	},
	{
		title: 'Sample Player',
		category: 'Audio',
		url: `${exampleProjectsBaseUrl}/samplePlayer.8f4e`,
	},
	{
		title: 'Simple Counter (Main Thread)',
		category: 'Misc',
		url: `${exampleProjectsBaseUrl}/simpleCounterMainThread.8f4e`,
	},
	{
		title: 'Standalone Project Example',
		category: 'Misc',
		url: `${exampleProjectsBaseUrl}/standaloneProject.8f4e`,
	},
	{
		title: 'Digit Classifier',
		category: 'Machine Learning',
		url: `${exampleProjectsBaseUrl}/digitClassifier.8f4e`,
	},
	{
		title: 'Digit Classifier (float64)',
		category: 'Machine Learning',
		url: `${exampleProjectsBaseUrl}/digitClassifier64.8f4e`,
	},
	{
		title: 'Keyboard-Controlled Mono Synth',
		category: 'Audio',
		url: `${exampleProjectsBaseUrl}/keyboardControlledMonoSynth.8f4e`,
	},
	{
		title: 'Keyboard-Controlled Two Operator FM Synth',
		category: 'Audio',
		url: `${exampleProjectsBaseUrl}/keyboardControlledTwoOperatorFMSynth.8f4e`,
	},
];
