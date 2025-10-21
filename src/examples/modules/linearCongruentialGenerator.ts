import type { ExampleModule } from '@8f4e/editor-state';

const linearCongruentialGenerator: ExampleModule = {
	title: 'Linear Congruential Generator (Signed, Float, 16bit, -1 - 1)',
	author: 'Andor Polgar',
	category: 'Random',
	code: `module lcg
; Linear congruential 
; generator

const multiplier 1664525
const increment 1013904223 
const modulus 65536 ; 2^16
int seed 69420

float out

push &seed
 push multiplier
 push seed
 mul
 push increment
 add
 push modulus
 remainder
store

push &out
 push seed
 castToFloat
 push modulus
 castToFloat
 div 
store

moduleEnd`,
	tests: [],
};

export default linearCongruentialGenerator;
