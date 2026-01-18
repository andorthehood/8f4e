import type { ExampleModule } from '@8f4e/editor-state';

const ringModulator: ExampleModule = {
	title: 'Ring Modulator',
	description: 'A simple ring modulator using a sine wave oscillator to modulate the input signal.',
	author: 'Andor Polgar',
	category: 'Modulation',
	dependencies: ['sine', 'math'],
	code: `module ringModulator

float defaultFreq 10
float* in &osc.out
float* freq &defaultFreq
float out
float phase

use math

push &phase
push phase
push TAU
push *freq
mul
push SAMPLE_RATE
castToFloat
ensureNonZero
div
add
store

push phase
push PI
greaterThan
if void
push &phase
push NEG_PI
store
ifEnd

push &out
push *in
push phase
call sine
mul
store

moduleEnd`,
	tests: [],
};

export default ringModulator;
