import audioBufferOut from './audioBufferOut';
import midiCodes from './midiCodes';
import quantizer from './quantizer';
import binarySequencer from './binarySequencer';
import midiNoteOut from './midiNoteOut';
import midiCCOut from './midiCCOut';
import generalMIDIDrumCodes from './generalMIDIDrumCodes';

const modules = {
	audioBufferOut,
	midiCodes,
	quantizer,
	binarySequencer,
	midiNoteOut,
	midiCCOut,
	generalMIDIDrumCodes,
} as const;

export default modules;
