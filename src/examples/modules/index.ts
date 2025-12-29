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
	{ slug: 'XORShift', title: 'XORShift (Signed, Float, -1 - 1)', category: 'Random/Generators' },
	{ slug: 'amenBreak64Step', title: 'Amen Break 64 Step', category: 'Break Beats' },
	{ slug: 'audioBufferOut', title: 'Audio Buffer Out', category: 'Audio Buffer' },
	{ slug: 'binSwitchesLSb', title: 'Binary Switches (LSb first)', category: 'Controllers/Binary' },
	{ slug: 'binSwitchesMSb', title: 'Binary Switches (MSb first)', category: 'Controllers/Binary' },
	{ slug: 'binaryGateSequencer', title: 'Binary Gate Sequencer', category: 'Sequencers/Gate' },
	{ slug: 'binaryShiftRegister', title: 'Binary Shift Register', category: 'Bitwise/Registers' },
	{ slug: 'bitcrusher', title: 'Bitcrusher', category: 'Effects/Distortion' },
	{ slug: 'bitwiseAnd', title: 'Bitwise AND', category: 'Bitwise/Logic' },
	{ slug: 'bitwiseOr', title: 'Bitwise OR', category: 'Bitwise/Logic' },
	{ slug: 'bitwiseXor', title: 'Bitwise XOR', category: 'Bitwise/Logic' },
	{ slug: 'bpmClock', title: 'BPM Clock', category: 'Clock' },
	{ slug: 'break16Step1', title: '16 Step Break 1', category: 'Break Beats' },
	{ slug: 'break16Step2', title: '16 Step Break 2', category: 'Break Beats' },
	{ slug: 'bufferCombinerInt', title: 'Buffer Combiner (Int)', category: 'Buffer/Combiner' },
	{ slug: 'bufferCombinerIntFloat', title: 'Buffer Combiner (Float)', category: 'Buffer/Combiner' },
	{ slug: 'bufferCopierFloat', title: 'Buffer Copier (Float)', category: 'Buffer/Copier' },
	{ slug: 'bufferCopierInt', title: 'Buffer Copier (Int)', category: 'Buffer/Copier' },
	{ slug: 'bufferFloatToInt', title: 'Float Buffer to Int Buffer Converter', category: 'Buffer/Converter' },
	{ slug: 'bufferIntToFloat', title: 'Int Buffer to Float Buffer Converter', category: 'Buffer/Converter' },
	{
		slug: 'bufferReplicatorWithOffsetInt',
		title: 'Buffer Replicator with Offset (Int)',
		category: 'Buffer/Replicator',
	},
	{
		slug: 'bufferReplicatorWithOffsetIntFloat',
		title: 'Buffer Replicator with Offset (Int)',
		category: 'Buffer/Replicator',
	},
	{ slug: 'bufferReverserFloat', title: 'Buffer Reverser (Float)', category: 'Buffer/Reverser' },
	{ slug: 'bufferReverserInt', title: 'Buffer Reverser (Int)', category: 'Buffer/Reverser' },
	{ slug: 'changeDetectorInt', title: 'Change Detector (Int)', category: 'Trigger' },
	{ slug: 'clockDivider', title: 'Clock Divider', category: 'Clock' },
	{ slug: 'decToBin8bitMSb', title: 'Decimal to Binary Converter (8bit, MSb)', category: 'Bitwise/Converter' },
	{ slug: 'delay', title: 'Delay', category: 'Effects/Time' },
	{ slug: 'expLookupTable', title: 'Exponent Function Lookup Table (-1...1)', category: 'Lookup Tables' },
	{ slug: 'generalMIDIDrumCodes', title: 'General MIDI Drum Codes', category: 'MIDI/Constants' },
	{
		slug: 'linearCongruentialGenerator',
		title: 'Linear Congruential Generator (Signed, Float, 16bit, -1 - 1)',
		category: 'Random/Generators',
	},
	{ slug: 'lowPassFilter', title: 'Low-pass Filter', category: 'Filters/Low-pass' },
	{ slug: 'mapToRangeFloat', title: 'Map Signal to Range (Float)', category: 'Utils/Mapping' },
	{ slug: 'mapToRangeFloatToInt', title: 'Map Signal to Range (Float to Int)', category: 'Utils/Mapping' },
	{ slug: 'mapToRangeInt', title: 'Map Signal to Range (Int)', category: 'Utils/Mapping' },
	{ slug: 'mapToVariableRangeFloat', title: 'Map Signal to Variable Range (Float)', category: 'Utils/Mapping' },
	{ slug: 'masterClock', title: 'Master Clock', category: 'Clock' },
	{ slug: 'midiCCOut', title: 'MIDI CC Out', category: 'MIDI/Output' },
	{ slug: 'midiCodes', title: 'MIDI Codes', category: 'MIDI/Constants' },
	{ slug: 'midiFrequenciesLookupTable', title: 'MIDI Frequencies Lookup Table', category: 'Lookup Tables' },
	{ slug: 'midiNoteOut', title: 'MIDI Note Out', category: 'MIDI/Output' },
	{ slug: 'midiPianoKeyboardC3', title: 'MIDI Piano Keyboard (First key: C3)', category: 'MIDI/Input' },
	{ slug: 'multipleFloat', title: 'Multiple (8x Float)', category: 'Utilities' },
	{ slug: 'multipleInt', title: 'Multiple (8x Int)', category: 'Utilities' },
	{ slug: 'pcmLooper', title: 'PCM Looper (8bit unsigned)', category: 'PCM/Looper' },
	{ slug: 'pcmLooperV16bitSigned', title: 'Variable Speed PCM Looper (16bit signed)', category: 'PCM/Looper' },
	{
		slug: 'pcmLooperVR16bitSigned',
		title: 'Variable Speed and Retriggerable PCM Looper (16bit signed)',
		category: 'PCM/Looper',
	},
	{
		slug: 'pcmLooperVRP16bitSigned',
		title: 'Retriggerable PCM Looper with Variable Speed and Start Position (16bit signed)',
		category: 'PCM/Looper',
	},
	{ slug: 'peakHolderNegativeFloat', title: 'Peak Holder (Negative, Float)', category: 'Debug Tools' },
	{ slug: 'peakHolderPositiveFloat', title: 'Peak Holder (Positive, Float)', category: 'Debug Tools' },
	{ slug: 'quantizer', title: 'Quantizer', category: 'Quantizers' },
	{ slug: 'reverb', title: 'Reverb', category: 'Effects/Time' },
	{ slug: 'ringModulator', title: 'Ring Modulator', category: 'Modulation' },
	{ slug: 'sampleAndHoldFloat', title: 'Sample & Hold (Float)', category: 'Utils/Sample' },
	{ slug: 'sampleAndHoldInt', title: 'Sample & Hold (Int)', category: 'Utils/Sample' },
	{ slug: 'sawSignedFloat', title: 'Saw (Signed, Float)', category: 'Oscillators/Waveform' },
	{ slug: 'sawUnsigned8bitInt', title: 'Saw (Unsigned, Int, 8bit)', category: 'Oscillators/Waveform' },
	{ slug: 'scopeSignedFloat', title: 'Scope (Signed, Float, -1-1)', category: 'Debug Tools' },
	{ slug: 'scopeUnsignedInt', title: 'Scope (Unsigned, Int, 0-255)', category: 'Debug Tools' },
	{ slug: 'sequencerFloat', title: 'Sequencer (Float)', category: 'Sequencers/Step' },
	{ slug: 'sequencerInt', title: 'Sequencer (Int)', category: 'Sequencers/Step' },
	{ slug: 'sequentialDemuxFloat', title: 'Sequential Demultiplexer (8 output, Float)', category: 'Sequencers/Mux' },
	{ slug: 'sequentialDemuxInt', title: 'Sequential Demultiplexer (8 output, Int)', category: 'Sequencers/Mux' },
	{ slug: 'sequentialMuxFloat', title: 'Sequential Multiplexer (8 input, Float)', category: 'Sequencers/Mux' },
	{ slug: 'sequentialMuxInt', title: 'Sequential Multiplexer (8 input, Int)', category: 'Sequencers/Mux' },
	{ slug: 'shiftRegisterFloat', title: 'Shift Register (8 outs, Float)', category: 'Utilities' },
	{ slug: 'shiftRegisterInt', title: 'Shift Register (8 outs, Int)', category: 'Utilities' },
	{
		slug: 'sigmoidPolynomialApproximation',
		title: 'Sigmoid Function (Polynomial Approximation)',
		category: 'Machine Learning',
	},
	{ slug: 'sineLookupTable', title: 'Sine Lookup Table', category: 'Lookup Tables' },
	{
		slug: 'phaseAccumulator',
		title: 'Phase Accumulator (Periodic, Float)',
		description: 'Phase accumulator that can drive any periodic function (defaults to sine).',
		category: 'Oscillators',
	},
	{ slug: 'squareSignedFloat', title: 'Square (Signed, Float)', category: 'Oscillators/Waveform' },
	{ slug: 'strumFloat', title: 'Strum (Float)', category: 'Sequencers' },
	{ slug: 'switchGatesFloat', title: 'Switchable Gates (8x Float)', category: 'Controllers/Gates' },
	{ slug: 'switchGatesInt', title: 'Switchable Gates (8x Int)', category: 'Controllers/Gates' },
	{ slug: 'triangleSignedFloat', title: 'Triangle (Signed, Float)', category: 'Oscillators/Waveform' },
	{ slug: 'sine', title: 'Sine [-PI, PI] (Polynomial Approximation)', category: 'Functions/Trigonometric' },
	{ slug: 'sigmoid', title: 'Sigmoid (Polynomial Approximation)', category: 'Functions/Activation' },
];

// For backwards compatibility, export a default object that matches the old API
// but note: accessing properties will not trigger loading - use the registry functions instead
export default moduleManifest;
