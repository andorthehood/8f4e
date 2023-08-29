import audioBuffer from './audioBuffer';
import bistableMultivibrators from './bistableMultivibrators';
import midiBreakBeat from './midiBreakBeat';
import midiBreakBreak2dSequencer from './midiBreakBreak2dSequencer';
import dancingWithTheSineLT from './dancingWithTheSineLT';
import randomGenerators from './randomGenerators';
import randomNoteGenerator from './randomNoteGenerator';
import midiArpeggiator from './midiArpeggiator';

const projects = {
	audioBuffer,
	bistableMultivibrators,
	midiBreakBeat,
	midiBreakBreak2dSequencer,
	dancingWithTheSineLT,
	randomGenerators,
	randomNoteGenerator,
	midiArpeggiator,
} as const;

export default projects;
