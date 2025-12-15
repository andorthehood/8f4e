import type { ExampleModule } from '@8f4e/editor-state';

const bufferReplicatorWithOffsetInt: ExampleModule = {
	title: 'Buffer Replicator with Offset (Int)',
	author: 'Andor Polgar',
	category: 'Buffer',
	code: `module replicator

const TIMES 2
const OFFSET 12

int* bufferIn
int* lengthIn
int[] buffer 64 ; max size
int length
int _pointer

push &length
push *lengthIn
push TIMES
mul
store

push &_pointer
push 0
store

; To avoid remainder by zero
push length
push 0
equal
branchIfTrue 0

loop
; Guard
push _pointer
push length
greaterOrEqual
branchIfTrue 1 
 
; Calculate destination
; address
push &buffer
push _pointer
push WORD_SIZE
mul
add

; Calculate source
; address
push bufferIn
push _pointer
push *lengthIn
remainder
push WORD_SIZE
mul
add
 
load ; value from src
 
push _pointer
push *lengthIn
div
push OFFSET
mul
add

store ; value to dst
 
; Increment buffer pointer
push &_pointer
push _pointer
push 1
add
store
loopEnd

moduleEnd`,
	tests: [],
};

export default bufferReplicatorWithOffsetInt;
