import type { ExampleModule, ModuleMetadata, Project, ProjectMetadata } from '../../packages/editor/src/state/types';

// Example modules registry with metadata and lazy loading
interface ModuleRegistryEntry {
	metadata: ModuleMetadata;
	loader: () => Promise<ExampleModule>;
}

interface ProjectRegistryEntry {
	metadata: ProjectMetadata;
	loader: () => Promise<Project>;
}

// Module registry with lazy loading functions
export const moduleRegistry: Record<string, ModuleRegistryEntry> = {
	audioBufferOut: {
		metadata: { slug: 'audioBufferOut', title: 'Audio Buffer Out', category: 'Audio Buffer' },
		loader: () => import('./modules/audioBufferOut').then(m => m.default),
	},
	midiCodes: {
		metadata: { slug: 'midiCodes', title: 'MIDI Codes', category: 'MIDI' },
		loader: () => import('./modules/midiCodes').then(m => m.default),
	},
	quantizer: {
		metadata: { slug: 'quantizer', title: 'Quantizer', category: 'Effects' },
		loader: () => import('./modules/quantizer').then(m => m.default),
	},
	binaryGateSequencer: {
		metadata: { slug: 'binaryGateSequencer', title: 'Binary Gate Sequencer', category: 'Sequencers' },
		loader: () => import('./modules/binaryGateSequencer').then(m => m.default),
	},
	midiNoteOut: {
		metadata: { slug: 'midiNoteOut', title: 'MIDI Note Out', category: 'MIDI' },
		loader: () => import('./modules/midiNoteOut').then(m => m.default),
	},
	midiCCOut: {
		metadata: { slug: 'midiCCOut', title: 'MIDI CC Out', category: 'MIDI' },
		loader: () => import('./modules/midiCCOut').then(m => m.default),
	},
	generalMIDIDrumCodes: {
		metadata: { slug: 'generalMIDIDrumCodes', title: 'General MIDI Drum Codes', category: 'MIDI' },
		loader: () => import('./modules/generalMIDIDrumCodes').then(m => m.default),
	},
	bitwiseAnd: {
		metadata: { slug: 'bitwiseAnd', title: 'Bitwise And', category: 'Logic' },
		loader: () => import('./modules/bitwiseAnd').then(m => m.default),
	},
	bitwiseOr: {
		metadata: { slug: 'bitwiseOr', title: 'Bitwise Or', category: 'Logic' },
		loader: () => import('./modules/bitwiseOr').then(m => m.default),
	},
	bitwiseXor: {
		metadata: { slug: 'bitwiseXor', title: 'Bitwise Xor', category: 'Logic' },
		loader: () => import('./modules/bitwiseXor').then(m => m.default),
	},
	break16Step1: {
		metadata: { slug: 'break16Step1', title: 'Break 16 Step 1', category: 'Sequencers' },
		loader: () => import('./modules/break16Step1').then(m => m.default),
	},
	break16Step2: {
		metadata: { slug: 'break16Step2', title: 'Break 16 Step 2', category: 'Sequencers' },
		loader: () => import('./modules/break16Step2').then(m => m.default),
	},
	decToBin8bitMSb: {
		metadata: { slug: 'decToBin8bitMSb', title: 'Dec to Bin 8bit MSb', category: 'Converters' },
		loader: () => import('./modules/decToBin8bitMSb').then(m => m.default),
	},
	amenBreak64Step: {
		metadata: { slug: 'amenBreak64Step', title: 'Amen Break 64 Step', category: 'Sequencers' },
		loader: () => import('./modules/amenBreak64Step').then(m => m.default),
	},
	clockDivider: {
		metadata: { slug: 'clockDivider', title: 'Clock Divider', category: 'Timing' },
		loader: () => import('./modules/clockDivider').then(m => m.default),
	},
	sineLookupTable: {
		metadata: { slug: 'sineLookupTable', title: 'Sine Lookup Table', category: 'Oscillators' },
		loader: () => import('./modules/sineLookupTable').then(m => m.default),
	},
	sawSignedFloat: {
		metadata: { slug: 'sawSignedFloat', title: 'Saw Signed Float', category: 'Oscillators' },
		loader: () => import('./modules/sawSignedFloat').then(m => m.default),
	},
	sawUnsignedFloat: {
		metadata: { slug: 'sawUnsignedFloat', title: 'Saw Unsigned Float', category: 'Oscillators' },
		loader: () => import('./modules/sawUnsigned8bitInt').then(m => m.default),
	},
	squareSignedFloat: {
		metadata: { slug: 'squareSignedFloat', title: 'Square Signed Float', category: 'Oscillators' },
		loader: () => import('./modules/squareSignedFloat').then(m => m.default),
	},
	triangleSignedFloat: {
		metadata: { slug: 'triangleSignedFloat', title: 'Triangle Signed Float', category: 'Oscillators' },
		loader: () => import('./modules/triangleSignedFloat').then(m => m.default),
	},
	scopeUnsignedInt: {
		metadata: { slug: 'scopeUnsignedInt', title: 'Scope Unsigned Int', category: 'Debug' },
		loader: () => import('./modules/scopeUnsignedInt').then(m => m.default),
	},
	scopeSignedFloat: {
		metadata: { slug: 'scopeSignedFloat', title: 'Scope Signed Float', category: 'Debug' },
		loader: () => import('./modules/scopeSignedFloat').then(m => m.default),
	},
	binSwitchesLSb: {
		metadata: { slug: 'binSwitchesLSb', title: 'Binary Switches LSb', category: 'Input' },
		loader: () => import('./modules/binSwitchesLSb').then(m => m.default),
	},
	binSwitchesMSb: {
		metadata: { slug: 'binSwitchesMSb', title: 'Binary Switches MSb', category: 'Input' },
		loader: () => import('./modules/binSwitchesMSb').then(m => m.default),
	},
	switchGatesInt: {
		metadata: { slug: 'switchGatesInt', title: 'Switch Gates Int', category: 'Logic' },
		loader: () => import('./modules/switchGatesInt').then(m => m.default),
	},
	switchGatesFloat: {
		metadata: { slug: 'switchGatesFloat', title: 'Switch Gates Float', category: 'Logic' },
		loader: () => import('./modules/switchGatesFloat').then(m => m.default),
	},
	mulFloat: {
		metadata: { slug: 'mulFloat', title: 'Multiple Float', category: 'Math' },
		loader: () => import('./modules/multipleFloat').then(m => m.default),
	},
	mulInt: {
		metadata: { slug: 'mulInt', title: 'Multiple Int', category: 'Math' },
		loader: () => import('./modules/multipleInt').then(m => m.default),
	},
	sequentialDemuxFloat: {
		metadata: { slug: 'sequentialDemuxFloat', title: 'Sequential Demux Float', category: 'Routing' },
		loader: () => import('./modules/sequentialDemuxFloat').then(m => m.default),
	},
	sequentialDemuxInt: {
		metadata: { slug: 'sequentialDemuxInt', title: 'Sequential Demux Int', category: 'Routing' },
		loader: () => import('./modules/sequentialDemuxInt').then(m => m.default),
	},
	sequentialMuxFloat: {
		metadata: { slug: 'sequentialMuxFloat', title: 'Sequential Mux Float', category: 'Routing' },
		loader: () => import('./modules/sequentialMuxFloat').then(m => m.default),
	},
	sequentialMuxInt: {
		metadata: { slug: 'sequentialMuxInt', title: 'Sequential Mux Int', category: 'Routing' },
		loader: () => import('./modules/sequentialMuxInt').then(m => m.default),
	},
	sequencerFloat: {
		metadata: { slug: 'sequencerFloat', title: 'Sequencer Float', category: 'Sequencers' },
		loader: () => import('./modules/sequencerFloat').then(m => m.default),
	},
	sequencerInt: {
		metadata: { slug: 'sequencerInt', title: 'Sequencer Int', category: 'Sequencers' },
		loader: () => import('./modules/sequencerInt').then(m => m.default),
	},
	shiftRegisterInt: {
		metadata: { slug: 'shiftRegisterInt', title: 'Shift Register Int', category: 'Logic' },
		loader: () => import('./modules/shiftRegisterInt').then(m => m.default),
	},
	shiftRegisterFloat: {
		metadata: { slug: 'shiftRegisterFloat', title: 'Shift Register Float', category: 'Logic' },
		loader: () => import('./modules/shiftRegisterFloat').then(m => m.default),
	},
	binaryShiftRegister: {
		metadata: { slug: 'binaryShiftRegister', title: 'Binary Shift Register', category: 'Logic' },
		loader: () => import('./modules/binaryShiftRegister').then(m => m.default),
	},
	linearCongruentialGenerator: {
		metadata: { slug: 'linearCongruentialGenerator', title: 'Linear Congruential Generator', category: 'Random' },
		loader: () => import('./modules/linearCongruentialGenerator').then(m => m.default),
	},
	peakHolderNegativeFloat: {
		metadata: { slug: 'peakHolderNegativeFloat', title: 'Peak Holder Negative Float', category: 'Effects' },
		loader: () => import('./modules/peakHolderNegativeFloat').then(m => m.default),
	},
	XORShift: {
		metadata: { slug: 'XORShift', title: 'XOR Shift', category: 'Random' },
		loader: () => import('./modules/XORShift').then(m => m.default),
	},
	midiPianoKeyboardC3: {
		metadata: { slug: 'midiPianoKeyboardC3', title: 'MIDI Piano Keyboard C3', category: 'Input' },
		loader: () => import('./modules/midiPianoKeyboardC3').then(m => m.default),
	},
	bufferCombinerFloat: {
		metadata: { slug: 'bufferCombinerFloat', title: 'Buffer Combiner Float', category: 'Buffers' },
		loader: () => import('./modules/bufferCombinerIntFloat').then(m => m.default),
	},
	bufferCombinerInt: {
		metadata: { slug: 'bufferCombinerInt', title: 'Buffer Combiner Int', category: 'Buffers' },
		loader: () => import('./modules/bufferCombinerInt').then(m => m.default),
	},
	bufferCopierFloat: {
		metadata: { slug: 'bufferCopierFloat', title: 'Buffer Copier Float', category: 'Buffers' },
		loader: () => import('./modules/bufferCopierFloat').then(m => m.default),
	},
	bufferCopierInt: {
		metadata: { slug: 'bufferCopierInt', title: 'Buffer Copier Int', category: 'Buffers' },
		loader: () => import('./modules/bufferCopierInt').then(m => m.default),
	},
	bufferReverserFloat: {
		metadata: { slug: 'bufferReverserFloat', title: 'Buffer Reverser Float', category: 'Buffers' },
		loader: () => import('./modules/bufferReverserFloat').then(m => m.default),
	},
	bufferReverserInt: {
		metadata: { slug: 'bufferReverserInt', title: 'Buffer Reverser Int', category: 'Buffers' },
		loader: () => import('./modules/bufferReverserInt').then(m => m.default),
	},
	bufferReplicatorWithOffsetInt: {
		metadata: {
			slug: 'bufferReplicatorWithOffsetInt',
			title: 'Buffer Replicator With Offset Int',
			category: 'Buffers',
		},
		loader: () => import('./modules/bufferReplicatorWithOffsetInt').then(m => m.default),
	},
	bufferReplicatorWithOffsetFloat: {
		metadata: {
			slug: 'bufferReplicatorWithOffsetFloat',
			title: 'Buffer Replicator With Offset Float',
			category: 'Buffers',
		},
		loader: () => import('./modules/bufferReplicatorWithOffsetIntFloat').then(m => m.default),
	},
	bufferIntToFloat: {
		metadata: { slug: 'bufferIntToFloat', title: 'Buffer Int To Float', category: 'Converters' },
		loader: () => import('./modules/bufferIntToFloat').then(m => m.default),
	},
	bufferFloatToInt: {
		metadata: { slug: 'bufferFloatToInt', title: 'Buffer Float To Int', category: 'Converters' },
		loader: () => import('./modules/bufferFloatToInt').then(m => m.default),
	},
	sampleAndHoldFloat: {
		metadata: { slug: 'sampleAndHoldFloat', title: 'Sample And Hold Float', category: 'Effects' },
		loader: () => import('./modules/sampleAndHoldFloat').then(m => m.default),
	},
	sampleAndHoldInt: {
		metadata: { slug: 'sampleAndHoldInt', title: 'Sample And Hold Int', category: 'Effects' },
		loader: () => import('./modules/sampleAndHoldInt').then(m => m.default),
	},
	masterClock: {
		metadata: { slug: 'masterClock', title: 'Master Clock', category: 'Timing' },
		loader: () => import('./modules/masterClock').then(m => m.default),
	},
	changeDetectorInt: {
		metadata: { slug: 'changeDetectorInt', title: 'Change Detector Int', category: 'Logic' },
		loader: () => import('./modules/changeDetectorInt').then(m => m.default),
	},
	midiFrequenciesLookupTable: {
		metadata: { slug: 'midiFrequenciesLookupTable', title: 'MIDI Frequencies Lookup Table', category: 'MIDI' },
		loader: () => import('./modules/midiFrequenciesLookupTable').then(m => m.default),
	},
	mapToRangeFloat: {
		metadata: { slug: 'mapToRangeFloat', title: 'Map To Range Float', category: 'Math' },
		loader: () => import('./modules/mapToRangeFloat').then(m => m.default),
	},
	mapToRangeInt: {
		metadata: { slug: 'mapToRangeInt', title: 'Map To Range Int', category: 'Math' },
		loader: () => import('./modules/mapToRangeInt').then(m => m.default),
	},
	mapToRangeFloatToInt: {
		metadata: { slug: 'mapToRangeFloatToInt', title: 'Map To Range Float To Int', category: 'Converters' },
		loader: () => import('./modules/mapToRangeFloatToInt').then(m => m.default),
	},
	mapToVariableRangeFloat: {
		metadata: { slug: 'mapToVariableRangeFloat', title: 'Map To Variable Range Float', category: 'Math' },
		loader: () => import('./modules/mapToVariableRangeFloat').then(m => m.default),
	},
	strumFloat: {
		metadata: { slug: 'strumFloat', title: 'Strum Float', category: 'Effects' },
		loader: () => import('./modules/strumFloat').then(m => m.default),
	},
	perceptronAnd: {
		metadata: { slug: 'perceptronAnd', title: 'Perceptron And', category: 'Neural Networks' },
		loader: () => import('./modules/perceptronAnd').then(m => m.default),
	},
	perceptronOr: {
		metadata: { slug: 'perceptronOr', title: 'Perceptron Or', category: 'Neural Networks' },
		loader: () => import('./modules/perceptronOr').then(m => m.default),
	},
	expLookupTable: {
		metadata: { slug: 'expLookupTable', title: 'Exp Lookup Table', category: 'Math' },
		loader: () => import('./modules/expLookupTable').then(m => m.default),
	},
	sigmoidPolynomialApproximation: {
		metadata: { slug: 'sigmoidPolynomialApproximation', title: 'Sigmoid Polynomial Approximation', category: 'Math' },
		loader: () => import('./modules/sigmoidPolynomialApproximation').then(m => m.default),
	},
	perceptron: {
		metadata: { slug: 'perceptron', title: 'Perceptron', category: 'Neural Networks' },
		loader: () => import('./modules/perceptron').then(m => m.default),
	},
	pcmLooper: {
		metadata: { slug: 'pcmLooper', title: 'PCM Looper', category: 'Audio Buffer' },
		loader: () => import('./modules/pcmLooper').then(m => m.default),
	},
	lowPassFilter: {
		metadata: { slug: 'lowPassFilter', title: 'Low Pass Filter', category: 'Effects' },
		loader: () => import('./modules/lowPassFilter').then(m => m.default),
	},
	pcmLooperV16bitSigned: {
		metadata: { slug: 'pcmLooperV16bitSigned', title: 'PCM Looper V 16bit Signed', category: 'Audio Buffer' },
		loader: () => import('./modules/pcmLooperV16bitSigned').then(m => m.default),
	},
	pcmLooperVR16bitSigned: {
		metadata: { slug: 'pcmLooperVR16bitSigned', title: 'PCM Looper VR 16bit Signed', category: 'Audio Buffer' },
		loader: () => import('./modules/pcmLooperVR16bitSigned').then(m => m.default),
	},
	pcmLooperVRP16bitSigned: {
		metadata: { slug: 'pcmLooperVRP16bitSigned', title: 'PCM Looper VRP 16bit Signed', category: 'Audio Buffer' },
		loader: () => import('./modules/pcmLooperVRP16bitSigned').then(m => m.default),
	},
	bpmClock: {
		metadata: { slug: 'bpmClock', title: 'BPM Clock', category: 'Timing' },
		loader: () => import('./modules/bpmClock').then(m => m.default),
	},
	reverb: {
		metadata: { slug: 'reverb', title: 'Reverb', category: 'Effects' },
		loader: () => import('./modules/reverb').then(m => m.default),
	},
	delay: {
		metadata: { slug: 'delay', title: 'Delay', category: 'Effects' },
		loader: () => import('./modules/delay').then(m => m.default),
	},
};

// Project registry with lazy loading functions
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

// Loading state management
let modulesLoaded = false;
let loadedModules: Record<string, ExampleModule> = {};

// Batch loading for modules - load all modules when first accessed
export async function loadAllModules(): Promise<Record<string, ExampleModule>> {
	if (modulesLoaded) {
		return loadedModules;
	}

	console.log('[Examples] Loading all modules in batch...');

	// Load all modules in parallel
	const modulePromises = Object.entries(moduleRegistry).map(async ([slug, entry]) => {
		const module = await entry.loader();
		return [slug, module] as const;
	});

	const moduleEntries = await Promise.all(modulePromises);
	loadedModules = Object.fromEntries(moduleEntries);
	modulesLoaded = true;

	console.log(`[Examples] Loaded ${Object.keys(loadedModules).length} modules`);
	return loadedModules;
}

// Get list of modules (metadata only)
export async function getListOfModules(): Promise<ModuleMetadata[]> {
	return Object.values(moduleRegistry).map(entry => entry.metadata);
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

// Type definitions for the module with proper index signatures
export type ModulesRegistry = typeof moduleRegistry;
export type ProjectsRegistry = typeof projectRegistry;

// For backwards compatibility, provide types that allow string indexing
export type ModulesType = { [K in keyof typeof moduleRegistry]: ExampleModule } & {
	[key: string]: ExampleModule | undefined;
};
export type ProjectsType = { [K in keyof typeof projectRegistry]: Project } & { [key: string]: Project | undefined };
