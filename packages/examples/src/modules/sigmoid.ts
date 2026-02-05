import type { ExampleModule } from '@8f4e/editor-state';

const sine: ExampleModule = {
	title: 'Sigmoid (Polynomial Approximation)',
	author: 'Andor Polgar',
	category: 'Functions',
	code: `function sigmoid
; Sigmoid function approximation
; using a polynomial
param float x

localGet x
dup
abs
push 1.0
add
ensureNonZero
div

functionEnd float`,
	tests: [],
};

export default sine;
