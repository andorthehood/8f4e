import type { ExampleModule } from '@8f4e/editor-state';

const bufferIntToFloat: ExampleModule = {
	title: 'Int Buffer to Float Buffer Converter',
	author: 'Andor Polgar',
	category: 'Buffer',
	code: `module bufferI2F

int* bufferIn
int* lengthIn
float[] buffer 16 ; size
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
 
load ; value from src
castToFloat

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

export default bufferIntToFloat;
