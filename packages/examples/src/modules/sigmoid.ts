import type { ExampleModule } from '@8f4e/editor-state';

const sine: ExampleModule = {
	title: 'Sigmoid (Fast Approximation)',
	author: 'Andor Polgar',
	category: 'Functions',
	code: `function sigmoid
; Fast sigmoid approximation
; of logistic sigmoid
; mapped to [0, 1]
param float x

localGet x
dup
abs
push 1.0
add
ensureNonZero
div
push 0.5
mul
push 0.5
add

functionEnd float`,
	tests: [],
};

export default sine;
