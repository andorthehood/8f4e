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
import break16Step1 from './break16Step1';
import break16Step2 from './break16Step2';
import decToBin8bitMSb from './decToBin8bitMSb';

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
	break16Step1,
	break16Step2,
	decToBin8bitMSb,
} as const;

export default modules;
