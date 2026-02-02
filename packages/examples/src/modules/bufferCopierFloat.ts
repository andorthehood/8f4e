import type { ExampleModule } from '@8f4e/editor-state';

const bufferCopierFloat: ExampleModule = {
	title: 'Buffer Copier (Float)',
	author: 'Andor Polgar',
	category: 'Buffer',
	code: `module copyBuffer

float* bufferIn
int* lengthIn
float[] buffer 16 ; max size
int length
int pointer

push &length
push *lengthIn
store

push &pointer
push 0
store

loop
; Guard
push pointer
push length
greaterOrEqual
branchIfTrue 1 
 
; Calculate destination
; address
push &buffer
push pointer
push %buffer
mul
add

; Calculate source
; address
push bufferIn
push pointer
push %bufferIn
mul
add
 
load ; value from src
 
; =-=-=-=-=-=-=-=-=-=-=
; You can add code here
; that manipulates
; the values
; =-=-=-=-=-=-=-=-=-=-=

store ; value to dst
 
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

export default bufferCopierFloat;
