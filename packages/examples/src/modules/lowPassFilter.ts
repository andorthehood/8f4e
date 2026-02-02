import type { ExampleModule } from '@8f4e/editor-state';

const lowPassFilter: ExampleModule = {
	title: 'Low-pass Filter',
	author: 'Andor Polgar',
	category: 'Filters',
	code: `module lowPassFilter

float* in
float out

float alpha 0.1

push &out
push alpha
push *in
mul
push 1.0
push alpha
sub
push out
mul
add 
store

moduleEnd`,
	tests: [],
};

export default lowPassFilter;
