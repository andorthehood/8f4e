import { ExampleModule } from '../../../packages/editor/src/state/types';

const perceptronOr: ExampleModule = {
	author: 'Andor Polgar',
	category: 'Machine Learning',
	code: `module or
const weight1 0.377
const weight2 0.11
const bias -0.01

int* in1
int* in2

debug out

int out

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
push 0.0
greaterThan
if int
 push 1
else
 push 0
end
store

end`,
	tests: [],
	title: 'Perceptron (with OR gate training)',
};

export default perceptronOr;
