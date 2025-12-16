import type { ExampleModule } from '@8f4e/editor-state';

const sine: ExampleModule = {
	title: 'Sine [-PI, PI] (Polynomial Approximation)',
	author: 'Andor Polgar',
	category: 'Functions',
	code: `function sine
; Polynomial approximation 
; of the sine function with
; Taylor series (7th order)
; Only works in the range of
; [-PI, PI]
param float x

const PI      3.141592653589793
const HALF_PI 1.570796326794896
const TWO_PI  6.283185307179586

; Fold to [-pi/2, pi/2]
localGet x
push HALF_PI
greaterThan
if void
push PI
localGet x
sub
localSet x
ifEnd

localGet x
push HALF_PI
push -1.0
mul
lessThan
if void
push PI
push -1.0
mul
localGet x
sub
localSet x
ifEnd

local float x2
localGet x
dup
mul
localSet x2

; Taylor coefficients
const T1 -0.1666666666
const T2 0.0083333333
const T3 -0.000198412

localGet x2
push T3
mul
push T2
add
localGet x2
mul
push T1
add
localGet x2
mul
push 1.0
add
localGet x
mul

functionEnd float`,
	tests: [],
};

export default sine;
