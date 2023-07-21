import audioBuffer from './audioBuffer';
import bistableMultivibrators from './bistableMultivibrators';
import midiBreakBeat from './midiBreakBeat';
import midiBreakBreak2dSequencer from './midiBreakBreak2dSequencer';
import dancingWithTheSineLT from './dancingWithTheSineLT';

const projects = {
	audioBuffer,
	bistableMultivibrators,
	midiBreakBeat,
	midiBreakBreak2dSequencer,
	dancingWithTheSineLT,
} as const;

export default projects;
