import audioBuffer from './audioBuffer';
import bistableMultivibrators from './bistableMultivibrators';
import midiBreakBeat from './midiBreakBeat';
import midiBreakBreak2dSequencer from './midiBreakBreak2dSequencer';

const projects = {
	audioBuffer,
	bistableMultivibrators,
	midiBreakBeat,
	midiBreakBreak2dSequencer,
} as const;

export default projects;
