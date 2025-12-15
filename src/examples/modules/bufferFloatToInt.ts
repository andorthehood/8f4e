import type { ExampleModule } from '@8f4e/editor-state';

const bufferFloatToInt: ExampleModule = {
	title: 'Float Buffer to Int Buffer Converter',
	author: 'Andor Polgar',
	category: 'Buffer',
	code: `module bufferF2I

float* bufferIn
int* lengthIn
int[] buffer 16 ; size
int length
int pointer

push &length
push *lengthIn
store

push &pointer
push 0
store

loop 
; Calculate destination
; address
push &buffer
push pointer
push WORD_SIZE
mul
add

; Calculate source
; address
push bufferIn
push pointer
push WORD_SIZE
mul
add
 
loadFloat ; value from src
round
castToInt

store ; value to dst
 
; Guard
push pointer
push length
push 1
sub
greaterOrEqual
branchIfTrue 1

; Increment buffer pointer
push &pointer
push pointer
push 1
add
store
loopEnd

moduleEnd`,
	tests: [],
};

export default bufferFloatToInt;
