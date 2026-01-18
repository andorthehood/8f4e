import type { ExampleModule } from '@8f4e/editor-state';

const phaseAccumulator: ExampleModule = {
	title: 'Phase Accumulator (Periodic, Float)',
	description: 'Phase accumulator that advances by frequency and can drive any periodic function (defaults to sine).',
	author: 'Andor Polgar',
	category: 'Oscillators',
	dependencies: ['sine'],
	code: `module phaseAccumulator

float* frequency
float phase
float out

const PI     3.141592653589793
const PI_   -3.141592653589793
const TWO_PI 6.283185307179586

; Advance phase by
; TWO_PI * frequency / SAMPLE_RATE
push &phase
push phase
push TWO_PI
push *frequency
mul
push SAMPLE_RATE
castToFloat
ensureNonZero
div
add
store 

; Wrap phase when it exceeds PI
push phase
push PI
greaterThan
if void
push &phase
push PI_
store
ifEnd

push &out
push phase
; You can swap this call 
; with any periodic function
call sine
store

moduleEnd`,
	tests: [],
};

export default phaseAccumulator;
