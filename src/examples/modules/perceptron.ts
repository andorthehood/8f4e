import type { ExampleModule } from '@8f4e/editor-state';

const perceptron: ExampleModule = {
	author: 'Andor Polgar',
	category: 'Machine Learning',
	code: `module perceptron
; Untrained perceptron

float* in1 
float* in2 
float out

; Training data
const w1 0.0
const w2 0.0
const bias 0.0

push &out
push *in1
push w1
mul
push *in2
push w2
mul
add
push bias
add
store
moduleEnd`,
	tests: [],
	title: 'Perceptron (Untrained)',
};

export default perceptron;
