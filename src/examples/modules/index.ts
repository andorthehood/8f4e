import audioBufferOut from './audioBufferOut';
import midiCodes from './midiCodes';
import quantizer from './quantizer';
import binaryGateSequencer from './binaryGateSequencer';
import midiNoteOut from './midiNoteOut';
import midiCCOut from './midiCCOut';
import generalMIDIDrumCodes from './generalMIDIDrumCodes';
import bitwiseAnd from './bitwiseAnd';
import bitwiseOr from './bitwiseOr';
import bitwiseXor from './bitwiseXor';
import break16Step1 from './break16Step1';
import break16Step2 from './break16Step2';
import decToBin8bitMSb from './decToBin8bitMSb';
import amenBreak64Step from './amenBreak64Step';
import clockDivider from './clockDivider';
import sineLookupTable from './sineLookupTable';
import sawSignedFloat from './sawSignedFloat';
import sawUnsignedFloat from './sawUnsigned8bitInt';
import squareSignedFloat from './squareSignedFloat';
import triangleSignedFloat from './triangleSignedFloat';
import scopeUnsignedInt from './scopeUnsignedInt';
import scopeSignedFloat from './scopeSignedFloat';
import binSwitchesLSb from './binSwitchesLSb';
import binSwitchesMSb from './binSwitchesMSb';
import switchGatesInt from './switchGatesInt';
import switchGatesFloat from './switchGatesFloat';
import mulFloat from './multipleFloat';
import mulInt from './multipleInt';
import sequentialDemuxFloat from './sequentialDemuxFloat';
import sequentialDemuxInt from './sequentialDemuxInt';
import sequentialMuxFloat from './sequentialMuxFloat';
import sequentialMuxInt from './sequentialMuxInt';
import sequencerFloat from './sequencerFloat';
import sequencerInt from './sequencerInt';

const modules = {
	audioBufferOut,
	midiCodes,
	quantizer,
	binaryGateSequencer,
	midiNoteOut,
	midiCCOut,
	generalMIDIDrumCodes,
	bitwiseAnd,
	bitwiseOr,
	bitwiseXor,
	break16Step1,
	break16Step2,
	decToBin8bitMSb,
	amenBreak64Step,
	clockDivider,
	sineLookupTable,
	sawSignedFloat,
	sawUnsignedFloat,
	squareSignedFloat,
	triangleSignedFloat,
	scopeUnsignedInt,
	scopeSignedFloat,
	binSwitchesLSb,
	binSwitchesMSb,
	switchGatesInt,
	switchGatesFloat,
	mulFloat,
	mulInt,
	sequentialDemuxFloat,
	sequentialDemuxInt,
	sequentialMuxFloat,
	sequentialMuxInt,
	sequencerFloat,
	sequencerInt,
} as const;

export default modules;
