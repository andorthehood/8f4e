import audioBufferOut from './audioBufferOut';
import midiCodes from './midiCodes';
import quantizer from './quantizer';
import binarySequencer from './binarySequencer';
import midiNoteOut from './midiNoteOut';
import midiCCOut from './midiCCOut';

const modules = { audioBufferOut, midiCodes, quantizer, binarySequencer, midiNoteOut, midiCCOut } as const;

export default modules;
