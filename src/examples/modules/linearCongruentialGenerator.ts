import type { ExampleModule } from '@8f4e/editor-state';

const linearCongruentialGenerator: ExampleModule = {
	title: 'Linear Congruential Generator (Signed, Float, 16bit, -1 - 1)',
	author: 'Andor Polgar',
	category: 'Random',
	code: `module lcg
; Linear congruential 
; generator

const MULTIPLIER 1664525
const INCREMENT 1013904223 
const MODULUS 65536 ; 2^16
int seed 69420

float out

push &seed
 push MULTIPLIER
 push seed
 mul
 push INCREMENT
 add
 push MODULUS
 remainder
store

push &out
 push seed
 castToFloat
 push MODULUS
 castToFloat
 div 
store

moduleEnd`,
	tests: [],
};

export default linearCongruentialGenerator;
