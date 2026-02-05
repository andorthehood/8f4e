import type { ExampleModule } from '@8f4e/editor-state';

const bufferReplicatorWithOffsetFloat: ExampleModule = {
	title: 'Buffer Replicator with Offset (Int)',
	author: 'Andor Polgar',
	category: 'Buffer',
	code: `module replicator2

const TIMES 4
const OFFSET 12.0

float* bufferIn
int* lengthIn
float[] buffer 64 ; max size
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
; Calculate destination
; address
push &buffer
push _pointer
push %buffer
mul
add

; Calculate source
; address
push bufferIn
push _pointer
push *lengthIn
remainder
push %bufferIn
mul
add
 
loadFloat

push _pointer
push *lengthIn
div
castToFloat
push OFFSET
mul
add

store ; value to dst

; Guard
push _pointer
push length
push 1
sub
greaterOrEqual
branchIfTrue 1
 
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

export default bufferReplicatorWithOffsetFloat;
