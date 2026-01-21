import type { ExampleModule } from '@8f4e/editor-state';

const XORShift: ExampleModule = {
	title: 'XORShift (Signed, Float, -1 - 1)',
	author: 'Andor Polgar',
	category: 'Random',
	code: `module XORShift

int seed 69420
float out

push &seed
 push seed
 push seed
 push 13
 shiftLeft
 xor

 push seed
 push 17
 shiftRight
 xor

 push seed
 push 5
 shiftLeft
 xor
store

push &out
 push seed
 castToFloat
 push ^seed
 castToFloat
 div
store

moduleEnd`,
	tests: [],
};

export default XORShift;
