import audioBufferOut from './audioBufferOut';
import midiCodes from './midiCodes';
import quantizer from './quantizer';

const modules = { audioBufferOut, midiCodes, quantizer } as const;

export default modules;
