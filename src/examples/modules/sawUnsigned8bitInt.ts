import type { ExampleModule } from '@8f4e/editor-state';

const sawUnsignedFloat: ExampleModule = {
	title: 'Saw (Unsigned, Int, 8bit)',
	author: 'Andor Polgar',
	category: 'Oscillators',
	code: `module saw

float default 1 ;Hz 
float* frequency &default
int out

# debug out

push &out
push out
castToFloat
push *frequency
push SAMPLE_RATE
castToFloat
div
push 255.0
mul
add
castToInt
store

push out
push 255
greaterThan
if void
 push &out
 push 0
 store
ifEnd

moduleEnd`,
	tests: [],
};

export default sawUnsignedFloat;
