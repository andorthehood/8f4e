import { ModuleGeneratorProps, ModuleTypeLookup } from '../state/types';

import abs from './abs';
import adc16bit from './adc16bit';
import adc8bit from './adc8bit';
import attenuator from './attenuator';
import bitwiseAnd from './bitwiseAnd';
import bitwiseOr from './bitwiseOr';
import bitwiseXor from './bitwiseXor';
import clockGenerator from './clockGenerator';
import constant from './constant';
import cvToMidi from './cvToMidi';
import invert from './invert';
import logicAnd from './logicAnd';
import logicNegate from './logicNegate';
import logicOr from './logicOr';
import logicXor from './logicXor';
import max from './max';
import midiNote from './midiNote';
import min from './min';
import mixer from './mixer';
import number from './number';
import offset from './offset';
import pianoQuantizer from './pianoQuantizer120';
import pianoQuantizer12 from './pianoQuantizer12';
import pianoQuantizer24 from './pianoQuantizer24';
import randomGenerator from './randomGenerator';
import sampleAndHold from './sampleAndHold';
import saw from './saw';
import scope from './scope';
import sequentialSwitch from './sequentialSwitch';
import splitter from './splitter';
import triangle from './triangle';

export default function generateModuleTypes(props: ModuleGeneratorProps): ModuleTypeLookup {
	return {
		abs: abs(props),
		adc16bit: adc16bit(props),
		adc8bit: adc8bit(props),
		attenuator: attenuator(props),
		bitwiseAnd: bitwiseAnd(props),
		bitwiseOr: bitwiseOr(props),
		bitwiseXor: bitwiseXor(props),
		clockGenerator: clockGenerator(props),
		constant: constant(props),
		cvToMidi: cvToMidi(props),
		invert: invert(props),
		logicAnd: logicAnd(props),
		logicNegate: logicNegate(props),
		logicOr: logicOr(props),
		logicXor: logicXor(props),
		max: max(props),
		midiNote: midiNote(props),
		min: min(props),
		mixer: mixer(props),
		number: number(props),
		offset: offset(props),
		pianoQuantizer: pianoQuantizer(props),
		pianoQuantizer12: pianoQuantizer12(props),
		pianoQuantizer24: pianoQuantizer24(props),
		randomGenerator: randomGenerator(props),
		sampleAndHold: sampleAndHold(props),
		saw: saw(props),
		scope: scope(props),
		sequentialSwitch: sequentialSwitch(props),
		splitter: splitter(props),
		triangle: triangle(props),
	};
}
