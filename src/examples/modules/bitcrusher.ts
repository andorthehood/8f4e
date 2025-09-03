import type { ExampleModule } from '../../../packages/editor/src/state/types';

const bitcrusher: ExampleModule = {
	title: 'Bitcrusher',
	author: 'Andor Polgar',
	category: 'Effects',
	code: `module bitcrusher

float* in &pcmLooper2.out
float defAmount 0.9
float* amount &defAmount
float out

debug out

push &out

 push *in
 push 1.0
 push *amount
 sub
 push 128.0
 mul

 mul
 round
 castToInt
 castToFloat

 push 1.0
 push *amount
 sub
 push 128.0
 mul

 ensureNonZero
 div
store

moduleEnd`,
	tests: [],
};

export default bitcrusher;
