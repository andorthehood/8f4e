import type { ExampleModule } from '@8f4e/editor-state';

const sawUnsignedFloat: ExampleModule = {
	title: 'Saw (Unsigned, Int, 8bit)',
	author: 'Andor Polgar',
	category: 'Oscillators',
	code: `module saw

float default 1 ;Hz 
float* frequency &default
int out
int8[] range8 1

; @debug out

push &out
push out
castToFloat
push *frequency
push SAMPLE_RATE
castToFloat
div
push ^range8
push !range8
sub
castToFloat
mul
add
castToInt
store

push out
push ^range8
push !range8
sub
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
