import type { ExampleModule } from '../../../packages/editor/src/state/types';

const perceptronAnd: ExampleModule = {
	author: 'Andor Polgar',
	category: 'Machine Learning',
	code: `module and

int* in1
int* in2
int out

; Training data
const weight1 0.369
const weight2 0.175
const bias -0.513

push &out
push bias
push *in1
castToFloat
push weight1
mul
push *in2
castToFloat
push weight2
mul
add
add

; Activation function
push 0.0
greaterThan
if int
 push 1
else
 push 0
ifEnd
store

moduleEnd`,
	tests: [],
	title: 'Perceptron (with AND gate training)',
};

export default perceptronAnd;
