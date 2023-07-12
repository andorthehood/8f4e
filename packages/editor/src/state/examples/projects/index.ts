import audioBuffer from './audioBuffer';
import bistableMultivibrators from './bistableMultivibrators';
import midiBreakBeat from './midiBreakBeat';
import midiAmenBreak from './midiAmenBreak';

const projects = {
	audioBuffer,
	bistableMultivibrators,
	midiBreakBeat,
	midiAmenBreak,
} as const;

export default projects;
