import type { ExampleModule, ModuleMetadata, Project, ProjectMetadata } from '../../packages/editor/src/state/types';

// Module metadata (organized for easy maintenance)
export const moduleMetadata: Record<string, ModuleMetadata> = {
	audioBufferOut: { slug: 'audioBufferOut', title: 'Audio Buffer Out', category: 'Audio Buffer' },
	midiCodes: { slug: 'midiCodes', title: 'MIDI Codes', category: 'MIDI' },
	quantizer: { slug: 'quantizer', title: 'Quantizer', category: 'Effects' },
	binaryGateSequencer: { slug: 'binaryGateSequencer', title: 'Binary Gate Sequencer', category: 'Sequencers' },
	midiNoteOut: { slug: 'midiNoteOut', title: 'MIDI Note Out', category: 'MIDI' },
	midiCCOut: { slug: 'midiCCOut', title: 'MIDI CC Out', category: 'MIDI' },
	generalMIDIDrumCodes: { slug: 'generalMIDIDrumCodes', title: 'General MIDI Drum Codes', category: 'MIDI' },
	bitwiseAnd: { slug: 'bitwiseAnd', title: 'Bitwise And', category: 'Logic' },
	bitwiseOr: { slug: 'bitwiseOr', title: 'Bitwise Or', category: 'Logic' },
	bitwiseXor: { slug: 'bitwiseXor', title: 'Bitwise Xor', category: 'Logic' },
	break16Step1: { slug: 'break16Step1', title: 'Break 16 Step 1', category: 'Sequencers' },
	break16Step2: { slug: 'break16Step2', title: 'Break 16 Step 2', category: 'Sequencers' },
	decToBin8bitMSb: { slug: 'decToBin8bitMSb', title: 'Dec to Bin 8bit MSb', category: 'Converters' },
	amenBreak64Step: { slug: 'amenBreak64Step', title: 'Amen Break 64 Step', category: 'Sequencers' },
	clockDivider: { slug: 'clockDivider', title: 'Clock Divider', category: 'Timing' },
	sineLookupTable: { slug: 'sineLookupTable', title: 'Sine Lookup Table', category: 'Oscillators' },
	sawSignedFloat: { slug: 'sawSignedFloat', title: 'Saw Signed Float', category: 'Oscillators' },
	sawUnsignedFloat: { slug: 'sawUnsignedFloat', title: 'Saw Unsigned Float', category: 'Oscillators' },
	squareSignedFloat: { slug: 'squareSignedFloat', title: 'Square Signed Float', category: 'Oscillators' },
	triangleSignedFloat: { slug: 'triangleSignedFloat', title: 'Triangle Signed Float', category: 'Oscillators' },
	scopeUnsignedInt: { slug: 'scopeUnsignedInt', title: 'Scope Unsigned Int', category: 'Debug' },
	scopeSignedFloat: { slug: 'scopeSignedFloat', title: 'Scope Signed Float', category: 'Debug' },
	binSwitchesLSb: { slug: 'binSwitchesLSb', title: 'Binary Switches LSb', category: 'Input' },
	binSwitchesMSb: { slug: 'binSwitchesMSb', title: 'Binary Switches MSb', category: 'Input' },
	switchGatesInt: { slug: 'switchGatesInt', title: 'Switch Gates Int', category: 'Logic' },
	switchGatesFloat: { slug: 'switchGatesFloat', title: 'Switch Gates Float', category: 'Logic' },
	mulFloat: { slug: 'mulFloat', title: 'Multiple Float', category: 'Math' },
	mulInt: { slug: 'mulInt', title: 'Multiple Int', category: 'Math' },
	sequentialDemuxFloat: { slug: 'sequentialDemuxFloat', title: 'Sequential Demux Float', category: 'Routing' },
	sequentialDemuxInt: { slug: 'sequentialDemuxInt', title: 'Sequential Demux Int', category: 'Routing' },
	sequentialMuxFloat: { slug: 'sequentialMuxFloat', title: 'Sequential Mux Float', category: 'Routing' },
	sequentialMuxInt: { slug: 'sequentialMuxInt', title: 'Sequential Mux Int', category: 'Routing' },
	sequencerFloat: { slug: 'sequencerFloat', title: 'Sequencer Float', category: 'Sequencers' },
	sequencerInt: { slug: 'sequencerInt', title: 'Sequencer Int', category: 'Sequencers' },
	shiftRegisterInt: { slug: 'shiftRegisterInt', title: 'Shift Register Int', category: 'Logic' },
	shiftRegisterFloat: { slug: 'shiftRegisterFloat', title: 'Shift Register Float', category: 'Logic' },
	binaryShiftRegister: { slug: 'binaryShiftRegister', title: 'Binary Shift Register', category: 'Logic' },
	linearCongruentialGenerator: {
		slug: 'linearCongruentialGenerator',
		title: 'Linear Congruential Generator',
		category: 'Random',
	},
	peakHolderNegativeFloat: {
		slug: 'peakHolderNegativeFloat',
		title: 'Peak Holder Negative Float',
		category: 'Effects',
	},
	XORShift: { slug: 'XORShift', title: 'XOR Shift', category: 'Random' },
	midiPianoKeyboardC3: { slug: 'midiPianoKeyboardC3', title: 'MIDI Piano Keyboard C3', category: 'Input' },
	bufferCombinerFloat: { slug: 'bufferCombinerFloat', title: 'Buffer Combiner Float', category: 'Buffers' },
	bufferCombinerInt: { slug: 'bufferCombinerInt', title: 'Buffer Combiner Int', category: 'Buffers' },
	bufferCopierFloat: { slug: 'bufferCopierFloat', title: 'Buffer Copier Float', category: 'Buffers' },
	bufferCopierInt: { slug: 'bufferCopierInt', title: 'Buffer Copier Int', category: 'Buffers' },
	bufferReverserFloat: { slug: 'bufferReverserFloat', title: 'Buffer Reverser Float', category: 'Buffers' },
	bufferReverserInt: { slug: 'bufferReverserInt', title: 'Buffer Reverser Int', category: 'Buffers' },
	bufferReplicatorWithOffsetInt: {
		slug: 'bufferReplicatorWithOffsetInt',
		title: 'Buffer Replicator With Offset Int',
		category: 'Buffers',
	},
	bufferReplicatorWithOffsetFloat: {
		slug: 'bufferReplicatorWithOffsetFloat',
		title: 'Buffer Replicator With Offset Float',
		category: 'Buffers',
	},
	bufferIntToFloat: { slug: 'bufferIntToFloat', title: 'Buffer Int To Float', category: 'Converters' },
	bufferFloatToInt: { slug: 'bufferFloatToInt', title: 'Buffer Float To Int', category: 'Converters' },
	sampleAndHoldFloat: { slug: 'sampleAndHoldFloat', title: 'Sample And Hold Float', category: 'Effects' },
	sampleAndHoldInt: { slug: 'sampleAndHoldInt', title: 'Sample And Hold Int', category: 'Effects' },
	masterClock: { slug: 'masterClock', title: 'Master Clock', category: 'Timing' },
	changeDetectorInt: { slug: 'changeDetectorInt', title: 'Change Detector Int', category: 'Logic' },
	midiFrequenciesLookupTable: {
		slug: 'midiFrequenciesLookupTable',
		title: 'MIDI Frequencies Lookup Table',
		category: 'MIDI',
	},
	mapToRangeFloat: { slug: 'mapToRangeFloat', title: 'Map To Range Float', category: 'Math' },
	mapToRangeInt: { slug: 'mapToRangeInt', title: 'Map To Range Int', category: 'Math' },
	mapToRangeFloatToInt: { slug: 'mapToRangeFloatToInt', title: 'Map To Range Float To Int', category: 'Converters' },
	mapToVariableRangeFloat: { slug: 'mapToVariableRangeFloat', title: 'Map To Variable Range Float', category: 'Math' },
	strumFloat: { slug: 'strumFloat', title: 'Strum Float', category: 'Effects' },
	perceptronAnd: { slug: 'perceptronAnd', title: 'Perceptron And', category: 'Neural Networks' },
	perceptronOr: { slug: 'perceptronOr', title: 'Perceptron Or', category: 'Neural Networks' },
	expLookupTable: { slug: 'expLookupTable', title: 'Exp Lookup Table', category: 'Math' },
	sigmoidPolynomialApproximation: {
		slug: 'sigmoidPolynomialApproximation',
		title: 'Sigmoid Polynomial Approximation',
		category: 'Math',
	},
	perceptron: { slug: 'perceptron', title: 'Perceptron', category: 'Neural Networks' },
	pcmLooper: { slug: 'pcmLooper', title: 'PCM Looper', category: 'Audio Buffer' },
	lowPassFilter: { slug: 'lowPassFilter', title: 'Low Pass Filter', category: 'Effects' },
	pcmLooperV16bitSigned: {
		slug: 'pcmLooperV16bitSigned',
		title: 'PCM Looper V 16bit Signed',
		category: 'Audio Buffer',
	},
	pcmLooperVR16bitSigned: {
		slug: 'pcmLooperVR16bitSigned',
		title: 'PCM Looper VR 16bit Signed',
		category: 'Audio Buffer',
	},
	pcmLooperVRP16bitSigned: {
		slug: 'pcmLooperVRP16bitSigned',
		title: 'PCM Looper VRP 16bit Signed',
		category: 'Audio Buffer',
	},
	bpmClock: { slug: 'bpmClock', title: 'BPM Clock', category: 'Timing' },
	reverb: { slug: 'reverb', title: 'Reverb', category: 'Effects' },
	delay: { slug: 'delay', title: 'Delay', category: 'Effects' },
};

// Project registry with lazy loading functions (individual loading strategy for projects)
interface ProjectRegistryEntry {
	metadata: ProjectMetadata;
	loader: () => Promise<Project>;
}

export const projectRegistry: Record<string, ProjectRegistryEntry> = {
	audioBuffer: {
		metadata: { slug: 'audioBuffer', title: 'Audio Buffer', description: '' },
		loader: () => import('./projects/audioBuffer').then(m => m.default),
	},
	bistableMultivibrators: {
		metadata: { slug: 'bistableMultivibrators', title: 'Bistable Multivibrators', description: '' },
		loader: () => import('./projects/bistableMultivibrators').then(m => m.default),
	},
	midiBreakBeat: {
		metadata: { slug: 'midiBreakBeat', title: 'MIDI Break Beat', description: '' },
		loader: () => import('./projects/midiBreakBeat').then(m => m.default),
	},
	midiBreakBreak2dSequencer: {
		metadata: { slug: 'midiBreakBreak2dSequencer', title: 'MIDI Break Break 2D Sequencer', description: '' },
		loader: () => import('./projects/midiBreakBreak2dSequencer').then(m => m.default),
	},
	dancingWithTheSineLT: {
		metadata: { slug: 'dancingWithTheSineLT', title: 'Dancing With The Sine LT', description: '' },
		loader: () => import('./projects/dancingWithTheSineLT').then(m => m.default),
	},
	randomGenerators: {
		metadata: { slug: 'randomGenerators', title: 'Random Generators', description: '' },
		loader: () => import('./projects/randomGenerators').then(m => m.default),
	},
	randomNoteGenerator: {
		metadata: { slug: 'randomNoteGenerator', title: 'Random Note Generator', description: '' },
		loader: () => import('./projects/randomNoteGenerator').then(m => m.default),
	},
	midiArpeggiator: {
		metadata: { slug: 'midiArpeggiator', title: 'MIDI Arpeggiator', description: '' },
		loader: () => import('./projects/midiArpeggiator').then(m => m.default),
	},
	midiArpeggiator2: {
		metadata: { slug: 'midiArpeggiator2', title: 'MIDI Arpeggiator 2', description: '' },
		loader: () => import('./projects/midiArpeggiator2').then(m => m.default),
	},
	ericSaiteGenerator: {
		metadata: { slug: 'ericSaiteGenerator', title: 'Eric Saite Generator', description: '' },
		loader: () => import('./projects/ericSaiteGenerator').then(m => m.default),
	},
	neuralNetwork: {
		metadata: { slug: 'neuralNetwork', title: 'Neural Network', description: '' },
		loader: () => import('./projects/neuralNetwork').then(m => m.default),
	},
	audioLoopback: {
		metadata: { slug: 'audioLoopback', title: 'Audio Loopback', description: '' },
		loader: () => import('./projects/audioLoopback').then(m => m.default),
	},
};

// Loading state management for modules
let modulesLoaded = false;
let loadedModules: Record<string, ExampleModule> = {};

// Single lazy import for all modules - no need to maintain separate import list!
export async function loadAllModules(): Promise<Record<string, ExampleModule>> {
	if (modulesLoaded) {
		return loadedModules;
	}

	console.log('[Examples] Loading all modules in batch...');

	// Single lazy import loads all modules at once
	const modulesImport = await import('./modules/index');
	loadedModules = modulesImport.default;
	modulesLoaded = true;

	console.log(`[Examples] Loaded ${Object.keys(loadedModules).length} modules`);
	return loadedModules;
}

// Get list of modules (metadata only)
export async function getListOfModules(): Promise<ModuleMetadata[]> {
	return Object.values(moduleMetadata);
}

// Get specific module (loads all modules if not loaded yet)
export async function getModule(slug: string): Promise<ExampleModule> {
	const modules = await loadAllModules();
	const module = modules[slug];
	if (!module) {
		throw new Error(`Module not found: ${slug}`);
	}
	return module;
}

// Get list of projects (metadata only)
export async function getListOfProjects(): Promise<ProjectMetadata[]> {
	return Object.values(projectRegistry).map(entry => entry.metadata);
}

// Get specific project (loads individual project on demand)
export async function getProject(slug: string): Promise<Project> {
	const entry = projectRegistry[slug];
	if (!entry) {
		throw new Error(`Project not found: ${slug}`);
	}

	console.log(`[Examples] Loading project: ${slug}`);
	const project = await entry.loader();
	console.log(`[Examples] Loaded project: ${project.title}`);
	return project;
}

// Type definitions for backwards compatibility
export type ModulesType = Record<string, ExampleModule> & { [key: string]: ExampleModule | undefined };
export type ProjectsType = Record<string, Project> & { [key: string]: Project | undefined };
