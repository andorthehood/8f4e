import type { ExampleModule } from '@8f4e/editor-state';

const sigmoidPolynomialApproximation: ExampleModule = {
	author: 'Andor Polgar',
	category: 'Machine Learning',
	code: `module sigmoid
; Polynomial sigmoid 
; funtion approximation

float* in
float out

push &out
push *in
push *in
abs
push 1.0
add
div
store

moduleEnd`,
	tests: [],
	title: 'Sigmoid Function (Polynomial Approximation)',
};

export default sigmoidPolynomialApproximation;
