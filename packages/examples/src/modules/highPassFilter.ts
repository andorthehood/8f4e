import type { ExampleModule } from '@8f4e/editor-state';

const highPassFilter: ExampleModule = {
	title: 'High-pass Filter',
	author: 'Andor Polgar',
	category: 'Filters',
	code: `module highPassFilter

float* in &vca.out
float out

float alpha 0.1

push &out
push *in
push out
push alpha
push *in
mul
push out
push alpha
mul
sub
add
sub
store

moduleEnd`,
	tests: [],
};

export default highPassFilter;
