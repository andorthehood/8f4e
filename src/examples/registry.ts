import { ExampleModule, Project } from '../../packages/editor/src/state/types';

// Type definitions for lazy loading
export interface ExampleModuleMetadata {
	title: string;
	author: string;
	category: string;
	loader: () => Promise<ExampleModule>;
}

export interface ExampleProjectMetadata {
	title: string;
	author: string;
	description: string;
	loader: () => Promise<Project>;
}

// Registry for all example modules
export const moduleRegistry: Record<string, ExampleModuleMetadata> = {
	audioBufferOut: {
		title: 'Audio Buffer Out',
		author: 'Andor Polgar',
		category: 'Audio',
		loader: () => import('./modules/audioBufferOut').then(m => m.default),
	},
	midiCodes: {
		title: 'MIDI Codes',
		author: 'Andor Polgar',
		category: 'MIDI',
		loader: () => import('./modules/midiCodes').then(m => m.default),
	},
	quantizer: {
		title: 'Quantizer',
		author: 'Andor Polgar',
		category: 'Math',
		loader: () => import('./modules/quantizer').then(m => m.default),
	},
	binaryGateSequencer: {
		title: 'Binary Gate Sequencer',
		author: 'Andor Polgar',
		category: 'Sequencing',
		loader: () => import('./modules/binaryGateSequencer').then(m => m.default),
	},
	midiNoteOut: {
		title: 'MIDI Note Out',
		author: 'Andor Polgar',
		category: 'MIDI',
		loader: () => import('./modules/midiNoteOut').then(m => m.default),
	},
	midiCCOut: {
		title: 'MIDI CC Out',
		author: 'Andor Polgar',
		category: 'MIDI',
		loader: () => import('./modules/midiCCOut').then(m => m.default),
	},
	generalMIDIDrumCodes: {
		title: 'General MIDI Drum Codes',
		author: 'Andor Polgar',
		category: 'MIDI',
		loader: () => import('./modules/generalMIDIDrumCodes').then(m => m.default),
	},
	bitwiseAnd: {
		title: 'Bitwise AND',
		author: 'Andor Polgar',
		category: 'Bitwise',
		loader: () => import('./modules/bitwiseAnd').then(m => m.default),
	},
	bitwiseOr: {
		title: 'Bitwise OR',
		author: 'Andor Polgar',
		category: 'Bitwise',
		loader: () => import('./modules/bitwiseOr').then(m => m.default),
	},
	bitwiseXor: {
		title: 'Bitwise XOR',
		author: 'Andor Polgar',
		category: 'Bitwise',
		loader: () => import('./modules/bitwiseXor').then(m => m.default),
	},
	break16Step1: {
		title: 'Break 16 Step 1',
		author: 'Andor Polgar',
		category: 'Drums',
		loader: () => import('./modules/break16Step1').then(m => m.default),
	},
	break16Step2: {
		title: 'Break 16 Step 2',
		author: 'Andor Polgar',
		category: 'Drums',
		loader: () => import('./modules/break16Step2').then(m => m.default),
	},
	decToBin8bitMSb: {
		title: 'Dec to Bin 8bit MSb',
		author: 'Andor Polgar',
		category: 'Bitwise',
		loader: () => import('./modules/decToBin8bitMSb').then(m => m.default),
	},
	amenBreak64Step: {
		title: 'Amen Break 64 Step',
		author: 'Andor Polgar',
		category: 'Drums',
		loader: () => import('./modules/amenBreak64Step').then(m => m.default),
	},
	clockDivider: {
		title: 'Clock Divider',
		author: 'Andor Polgar',
		category: 'Clock',
		loader: () => import('./modules/clockDivider').then(m => m.default),
	},
	sineLookupTable: {
		title: 'Sine Lookup Table',
		author: 'Andor Polgar',
		category: 'Waveforms',
		loader: () => import('./modules/sineLookupTable').then(m => m.default),
	},
	sawSignedFloat: {
		title: 'Saw Signed Float',
		author: 'Andor Polgar',
		category: 'Waveforms',
		loader: () => import('./modules/sawSignedFloat').then(m => m.default),
	},
	sawUnsignedFloat: {
		title: 'Saw Unsigned Float',
		author: 'Andor Polgar',
		category: 'Waveforms',
		loader: () => import('./modules/sawUnsigned8bitInt').then(m => m.default),
	},
	squareSignedFloat: {
		title: 'Square Signed Float',
		author: 'Andor Polgar',
		category: 'Waveforms',
		loader: () => import('./modules/squareSignedFloat').then(m => m.default),
	},
	triangleSignedFloat: {
		title: 'Triangle Signed Float',
		author: 'Andor Polgar',
		category: 'Waveforms',
		loader: () => import('./modules/triangleSignedFloat').then(m => m.default),
	},
	scopeUnsignedInt: {
		title: 'Scope Unsigned Int',
		author: 'Andor Polgar',
		category: 'Debug',
		loader: () => import('./modules/scopeUnsignedInt').then(m => m.default),
	},
	scopeSignedFloat: {
		title: 'Scope Signed Float',
		author: 'Andor Polgar',
		category: 'Debug',
		loader: () => import('./modules/scopeSignedFloat').then(m => m.default),
	},
	binSwitchesLSb: {
		title: 'Binary Switches LSb',
		author: 'Andor Polgar',
		category: 'Input',
		loader: () => import('./modules/binSwitchesLSb').then(m => m.default),
	},
	binSwitchesMSb: {
		title: 'Binary Switches MSb',
		author: 'Andor Polgar',
		category: 'Input',
		loader: () => import('./modules/binSwitchesMSb').then(m => m.default),
	},
	switchGatesInt: {
		title: 'Switch Gates Int',
		author: 'Andor Polgar',
		category: 'Logic',
		loader: () => import('./modules/switchGatesInt').then(m => m.default),
	},
	switchGatesFloat: {
		title: 'Switch Gates Float',
		author: 'Andor Polgar',
		category: 'Logic',
		loader: () => import('./modules/switchGatesFloat').then(m => m.default),
	},
	mulFloat: {
		title: 'Multiple Float',
		author: 'Andor Polgar',
		category: 'Math',
		loader: () => import('./modules/multipleFloat').then(m => m.default),
	},
	mulInt: {
		title: 'Multiple Int',
		author: 'Andor Polgar',
		category: 'Math',
		loader: () => import('./modules/multipleInt').then(m => m.default),
	},
	sequentialDemuxFloat: {
		title: 'Sequential Demux Float',
		author: 'Andor Polgar',
		category: 'Logic',
		loader: () => import('./modules/sequentialDemuxFloat').then(m => m.default),
	},
	sequentialDemuxInt: {
		title: 'Sequential Demux Int',
		author: 'Andor Polgar',
		category: 'Logic',
		loader: () => import('./modules/sequentialDemuxInt').then(m => m.default),
	},
	sequentialMuxFloat: {
		title: 'Sequential Mux Float',
		author: 'Andor Polgar',
		category: 'Logic',
		loader: () => import('./modules/sequentialMuxFloat').then(m => m.default),
	},
	sequentialMuxInt: {
		title: 'Sequential Mux Int',
		author: 'Andor Polgar',
		category: 'Logic',
		loader: () => import('./modules/sequentialMuxInt').then(m => m.default),
	},
	sequencerFloat: {
		title: 'Sequencer Float',
		author: 'Andor Polgar',
		category: 'Sequencing',
		loader: () => import('./modules/sequencerFloat').then(m => m.default),
	},
	sequencerInt: {
		title: 'Sequencer Int',
		author: 'Andor Polgar',
		category: 'Sequencing',
		loader: () => import('./modules/sequencerInt').then(m => m.default),
	},
	shiftRegisterInt: {
		title: 'Shift Register Int',
		author: 'Andor Polgar',
		category: 'Logic',
		loader: () => import('./modules/shiftRegisterInt').then(m => m.default),
	},
	shiftRegisterFloat: {
		title: 'Shift Register Float',
		author: 'Andor Polgar',
		category: 'Logic',
		loader: () => import('./modules/shiftRegisterFloat').then(m => m.default),
	},
	binaryShiftRegister: {
		title: 'Binary Shift Register',
		author: 'Andor Polgar',
		category: 'Bitwise',
		loader: () => import('./modules/binaryShiftRegister').then(m => m.default),
	},
	linearCongruentialGenerator: {
		title: 'Linear Congruential Generator',
		author: 'Andor Polgar',
		category: 'Random',
		loader: () => import('./modules/linearCongruentialGenerator').then(m => m.default),
	},
	peakHolderNegativeFloat: {
		title: 'Peak Holder Negative Float',
		author: 'Andor Polgar',
		category: 'Math',
		loader: () => import('./modules/peakHolderNegativeFloat').then(m => m.default),
	},
	XORShift: {
		title: 'XOR Shift',
		author: 'Andor Polgar',
		category: 'Random',
		loader: () => import('./modules/XORShift').then(m => m.default),
	},
	midiPianoKeyboardC3: {
		title: 'MIDI Piano Keyboard C3',
		author: 'Andor Polgar',
		category: 'MIDI',
		loader: () => import('./modules/midiPianoKeyboardC3').then(m => m.default),
	},
	bufferCombinerFloat: {
		title: 'Buffer Combiner Float',
		author: 'Andor Polgar',
		category: 'Buffer',
		loader: () => import('./modules/bufferCombinerIntFloat').then(m => m.default),
	},
	bufferCombinerInt: {
		title: 'Buffer Combiner Int',
		author: 'Andor Polgar',
		category: 'Buffer',
		loader: () => import('./modules/bufferCombinerInt').then(m => m.default),
	},
	bufferCopierFloat: {
		title: 'Buffer Copier Float',
		author: 'Andor Polgar',
		category: 'Buffer',
		loader: () => import('./modules/bufferCopierFloat').then(m => m.default),
	},
	bufferCopierInt: {
		title: 'Buffer Copier Int',
		author: 'Andor Polgar',
		category: 'Buffer',
		loader: () => import('./modules/bufferCopierInt').then(m => m.default),
	},
	bufferReverserFloat: {
		title: 'Buffer Reverser Float',
		author: 'Andor Polgar',
		category: 'Buffer',
		loader: () => import('./modules/bufferReverserFloat').then(m => m.default),
	},
	bufferReverserInt: {
		title: 'Buffer Reverser Int',
		author: 'Andor Polgar',
		category: 'Buffer',
		loader: () => import('./modules/bufferReverserInt').then(m => m.default),
	},
	bufferReplicatorWithOffsetInt: {
		title: 'Buffer Replicator With Offset Int',
		author: 'Andor Polgar',
		category: 'Buffer',
		loader: () => import('./modules/bufferReplicatorWithOffsetInt').then(m => m.default),
	},
	bufferReplicatorWithOffsetFloat: {
		title: 'Buffer Replicator With Offset Float',
		author: 'Andor Polgar',
		category: 'Buffer',
		loader: () => import('./modules/bufferReplicatorWithOffsetIntFloat').then(m => m.default),
	},
	bufferIntToFloat: {
		title: 'Buffer Int To Float',
		author: 'Andor Polgar',
		category: 'Buffer',
		loader: () => import('./modules/bufferIntToFloat').then(m => m.default),
	},
	bufferFloatToInt: {
		title: 'Buffer Float To Int',
		author: 'Andor Polgar',
		category: 'Buffer',
		loader: () => import('./modules/bufferFloatToInt').then(m => m.default),
	},
	sampleAndHoldFloat: {
		title: 'Sample And Hold Float',
		author: 'Andor Polgar',
		category: 'Logic',
		loader: () => import('./modules/sampleAndHoldFloat').then(m => m.default),
	},
	sampleAndHoldInt: {
		title: 'Sample And Hold Int',
		author: 'Andor Polgar',
		category: 'Logic',
		loader: () => import('./modules/sampleAndHoldInt').then(m => m.default),
	},
	masterClock: {
		title: 'Master Clock',
		author: 'Andor Polgar',
		category: 'Clock',
		loader: () => import('./modules/masterClock').then(m => m.default),
	},
	changeDetectorInt: {
		title: 'Change Detector Int',
		author: 'Andor Polgar',
		category: 'Logic',
		loader: () => import('./modules/changeDetectorInt').then(m => m.default),
	},
	midiFrequenciesLookupTable: {
		title: 'MIDI Frequencies Lookup Table',
		author: 'Andor Polgar',
		category: 'MIDI',
		loader: () => import('./modules/midiFrequenciesLookupTable').then(m => m.default),
	},
	mapToRangeFloat: {
		title: 'Map To Range Float',
		author: 'Andor Polgar',
		category: 'Math',
		loader: () => import('./modules/mapToRangeFloat').then(m => m.default),
	},
	mapToRangeInt: {
		title: 'Map To Range Int',
		author: 'Andor Polgar',
		category: 'Math',
		loader: () => import('./modules/mapToRangeInt').then(m => m.default),
	},
	mapToRangeFloatToInt: {
		title: 'Map To Range Float To Int',
		author: 'Andor Polgar',
		category: 'Math',
		loader: () => import('./modules/mapToRangeFloatToInt').then(m => m.default),
	},
	mapToVariableRangeFloat: {
		title: 'Map To Variable Range Float',
		author: 'Andor Polgar',
		category: 'Math',
		loader: () => import('./modules/mapToVariableRangeFloat').then(m => m.default),
	},
	strumFloat: {
		title: 'Strum Float',
		author: 'Andor Polgar',
		category: 'Audio',
		loader: () => import('./modules/strumFloat').then(m => m.default),
	},
	perceptronAnd: {
		title: 'Perceptron AND',
		author: 'Andor Polgar',
		category: 'Neural Network',
		loader: () => import('./modules/perceptronAnd').then(m => m.default),
	},
	perceptronOr: {
		title: 'Perceptron OR',
		author: 'Andor Polgar',
		category: 'Neural Network',
		loader: () => import('./modules/perceptronOr').then(m => m.default),
	},
	expLookupTable: {
		title: 'Exp Lookup Table',
		author: 'Andor Polgar',
		category: 'Math',
		loader: () => import('./modules/expLookupTable').then(m => m.default),
	},
	sigmoidPolynomialApproximation: {
		title: 'Sigmoid Polynomial Approximation',
		author: 'Andor Polgar',
		category: 'Neural Network',
		loader: () => import('./modules/sigmoidPolynomialApproximation').then(m => m.default),
	},
	perceptron: {
		title: 'Perceptron',
		author: 'Andor Polgar',
		category: 'Neural Network',
		loader: () => import('./modules/perceptron').then(m => m.default),
	},
	pcmLooper: {
		title: 'PCM Looper',
		author: 'Andor Polgar',
		category: 'Audio',
		loader: () => import('./modules/pcmLooper').then(m => m.default),
	},
	lowPassFilter: {
		title: 'Low Pass Filter',
		author: 'Andor Polgar',
		category: 'Audio',
		loader: () => import('./modules/lowPassFilter').then(m => m.default),
	},
	pcmLooperV16bitSigned: {
		title: 'PCM Looper V 16bit Signed',
		author: 'Andor Polgar',
		category: 'Audio',
		loader: () => import('./modules/pcmLooperV16bitSigned').then(m => m.default),
	},
	pcmLooperVR16bitSigned: {
		title: 'PCM Looper VR 16bit Signed',
		author: 'Andor Polgar',
		category: 'Audio',
		loader: () => import('./modules/pcmLooperVR16bitSigned').then(m => m.default),
	},
	pcmLooperVRP16bitSigned: {
		title: 'PCM Looper VRP 16bit Signed',
		author: 'Andor Polgar',
		category: 'Audio',
		loader: () => import('./modules/pcmLooperVRP16bitSigned').then(m => m.default),
	},
	bpmClock: {
		title: 'BPM Clock',
		author: 'Andor Polgar',
		category: 'Clock',
		loader: () => import('./modules/bpmClock').then(m => m.default),
	},
	reverb: {
		title: 'Reverb',
		author: 'Andor Polgar',
		category: 'Audio',
		loader: () => import('./modules/reverb').then(m => m.default),
	},
	delay: {
		title: 'Delay',
		author: 'Andor Polgar',
		category: 'Audio',
		loader: () => import('./modules/delay').then(m => m.default),
	},
};

// Registry for all example projects
export const projectRegistry: Record<string, ExampleProjectMetadata> = {
	audioBuffer: {
		title: 'Audio Buffer',
		author: 'Andor Polgar',
		description: 'Audio buffer example with sawtooth waveform',
		loader: () => import('./projects/audioBuffer').then(m => m.default),
	},
	bistableMultivibrators: {
		title: 'Bistable Multivibrators',
		author: 'Andor Polgar',
		description: 'Bistable multivibrator circuits',
		loader: () => import('./projects/bistableMultivibrators').then(m => m.default),
	},
	midiBreakBeat: {
		title: 'MIDI Break Beat',
		author: 'Andor Polgar',
		description: 'MIDI break beat pattern generator',
		loader: () => import('./projects/midiBreakBeat').then(m => m.default),
	},
	midiBreakBreak2dSequencer: {
		title: 'MIDI Break Break 2D Sequencer',
		author: 'Andor Polgar',
		description: '2D MIDI sequencer for break beats',
		loader: () => import('./projects/midiBreakBreak2dSequencer').then(m => m.default),
	},
	dancingWithTheSineLT: {
		title: 'Dancing With The Sine LT',
		author: 'Andor Polgar',
		description: 'Sine wave manipulation and visualization',
		loader: () => import('./projects/dancingWithTheSineLT').then(m => m.default),
	},
	randomGenerators: {
		title: 'Random Generators',
		author: 'Andor Polgar',
		description: 'Various random number generation techniques',
		loader: () => import('./projects/randomGenerators').then(m => m.default),
	},
	randomNoteGenerator: {
		title: 'Random Note Generator',
		author: 'Andor Polgar',
		description: 'Random musical note generation',
		loader: () => import('./projects/randomNoteGenerator').then(m => m.default),
	},
	midiArpeggiator: {
		title: 'MIDI Arpeggiator',
		author: 'Andor Polgar',
		description: 'MIDI arpeggiator implementation',
		loader: () => import('./projects/midiArpeggiator').then(m => m.default),
	},
	midiArpeggiator2: {
		title: 'MIDI Arpeggiator 2',
		author: 'Andor Polgar',
		description: 'Advanced MIDI arpeggiator implementation',
		loader: () => import('./projects/midiArpeggiator2').then(m => m.default),
	},
	ericSaiteGenerator: {
		title: 'Eric Saite Generator',
		author: 'Andor Polgar',
		description: 'Eric Saite algorithm implementation',
		loader: () => import('./projects/ericSaiteGenerator').then(m => m.default),
	},
	neuralNetwork: {
		title: 'Neural Network',
		author: 'Andor Polgar',
		description: 'Basic neural network implementation',
		loader: () => import('./projects/neuralNetwork').then(m => m.default),
	},
	audioLoopback: {
		title: 'Audio Loopback',
		author: 'Andor Polgar',
		description: 'Audio loopback and processing',
		loader: () => import('./projects/audioLoopback').then(m => m.default),
	},
};

// Loading state management
let modulesLoaded = false;
let modulesLoadingPromise: Promise<Record<string, ExampleModule>> | null = null;

// Batch load all modules when first accessed
export async function loadAllModules(): Promise<Record<string, ExampleModule>> {
	if (modulesLoaded) {
		// Return already loaded modules from cache if available
		const loadedModules: Record<string, ExampleModule> = {};
		for (const [key, metadata] of Object.entries(moduleRegistry)) {
			// For now, we'll re-load since we don't have a persistent cache
			// In a more sophisticated implementation, we'd cache the loaded modules
			loadedModules[key] = await metadata.loader();
		}
		return loadedModules;
	}

	if (modulesLoadingPromise) {
		return modulesLoadingPromise;
	}

	modulesLoadingPromise = (async () => {
		const modulePromises = Object.entries(moduleRegistry).map(async ([key, metadata]) => [
			key,
			await metadata.loader(),
		]);

		const moduleEntries = await Promise.all(modulePromises);
		const modules = Object.fromEntries(moduleEntries);

		modulesLoaded = true;
		return modules;
	})();

	return modulesLoadingPromise;
}

// Load individual project when needed
export async function loadProject(projectKey: string): Promise<Project> {
	const metadata = projectRegistry[projectKey];
	if (!metadata) {
		throw new Error(`Project '${projectKey}' not found in registry`);
	}
	return metadata.loader();
}

// Get project metadata without loading the full project
export function getProjectMetadata(projectKey: string): Omit<ExampleProjectMetadata, 'loader'> | null {
	const metadata = projectRegistry[projectKey];
	if (!metadata) {
		return null;
	}
	return {
		title: metadata.title,
		author: metadata.author,
		description: metadata.description,
	};
}

// Get all project metadata for browsing
export function getAllProjectMetadata(): Record<string, Omit<ExampleProjectMetadata, 'loader'>> {
	const metadata: Record<string, Omit<ExampleProjectMetadata, 'loader'>> = {};
	for (const [key, data] of Object.entries(projectRegistry)) {
		metadata[key] = {
			title: data.title,
			author: data.author,
			description: data.description,
		};
	}
	return metadata;
}

// Get module metadata without loading modules
export function getModuleMetadata(moduleKey: string): Omit<ExampleModuleMetadata, 'loader'> | null {
	const metadata = moduleRegistry[moduleKey];
	if (!metadata) {
		return null;
	}
	return {
		title: metadata.title,
		author: metadata.author,
		category: metadata.category,
	};
}

// Get all module metadata for browsing
export function getAllModuleMetadata(): Record<string, Omit<ExampleModuleMetadata, 'loader'>> {
	const metadata: Record<string, Omit<ExampleModuleMetadata, 'loader'>> = {};
	for (const [key, data] of Object.entries(moduleRegistry)) {
		metadata[key] = {
			title: data.title,
			author: data.author,
			category: data.category,
		};
	}
	return metadata;
}
