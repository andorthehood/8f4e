import type { ExampleModule } from '@8f4e/editor-state';

const sawSignedFloat: ExampleModule = {
	title: 'Saw (Signed, Float)',
	author: 'Andor Polgar',
	category: 'Oscillators',
	code: `module saw

float default 0.5 ;Hz 
float* frequency &default
float out

push &out
push out
push *frequency
push SAMPLE_RATE
castToFloat
div
add
store

push out
push 1.0
greaterThan
if void
push &out
push 0.0
store
ifEnd

moduleEnd`,
	tests: [],
};

export default sawSignedFloat;
