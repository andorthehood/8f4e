import audioBufferOut from './audioBufferOut';
import midiCodes from './midiCodes';
import quantizer from './quantizer';
import binarySequencer from './binarySequencer';
import midiNoteOut from './midiNoteOut';
import midiCCOut from './midiCCOut';
import generalMIDIDrumCodes from './generalMIDIDrumCodes';
import bitwiseAnd from './bitwiseAnd';
import bitwiseOr from './bitwiseOr';
import bitwiseXor from './bitwiseXor';

const modules = {
	audioBufferOut,
	midiCodes,
	quantizer,
	binarySequencer,
	midiNoteOut,
	midiCCOut,
	generalMIDIDrumCodes,
	bitwiseAnd,
	bitwiseOr,
	bitwiseXor,
} as const;

export default modules;
