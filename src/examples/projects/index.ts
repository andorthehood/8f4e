import audioBuffer from './audioBuffer';
import bistableMultivibrators from './bistableMultivibrators';
import midiBreakBeat from './midiBreakBeat';
import midiBreakBreak2dSequencer from './midiBreakBreak2dSequencer';
import dancingWithTheSineLT from './dancingWithTheSineLT';
import randomGenerators from './randomGenerators';
import randomNoteGenerator from './randomNoteGenerator';
import midiArpeggiator from './midiArpeggiator';
import midiArpeggiator2 from './midiArpeggiator2';
import ericSaiteGenerator from './ericSaiteGenerator';
import neuralNetwork from './neuralNetwork';

const projects = {
	audioBuffer,
	bistableMultivibrators,
	midiBreakBeat,
	midiBreakBreak2dSequencer,
	dancingWithTheSineLT,
	randomGenerators,
	randomNoteGenerator,
	midiArpeggiator,
	midiArpeggiator2,
	ericSaiteGenerator,
	neuralNetwork,
} as const;

export default projects;
