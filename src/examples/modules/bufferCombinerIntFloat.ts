import type { ExampleModule } from '@8f4e/editor-state';

const bufferCombinerFloat: ExampleModule = {
	title: 'Buffer Combiner (Float)',
	author: 'Andor Polgar',
	category: 'Buffer',
	code: `module bufferCombiner

float* bufferA
int* lengthA
float* bufferB
int* lengthB

float[] buffer 16
int length

int bufferPointer

; Calculate combined length
push &length
push *lengthA
push *lengthB
add
store

; Reset buffer pointer
push &bufferPointer
push 0
store
 
loop
; Guard 
push bufferPointer
push length
greaterOrEqual
branchIfTrue 1
 
; Calculate destination
; buffer address
push &buffer
push bufferPointer
push WORD_SIZE
mul
add
 
; Calculate sorce
; buffer address
push bufferPointer
push *lengthA
lessThan
if int
push bufferA  
push bufferPointer
push WORD_SIZE
mul
add
else
push bufferB
push bufferPointer
push *lengthA
sub
push WORD_SIZE
mul
add
ifEnd

load ; value from src
store ; value in dst
 
; Increment buffer pointer
push &bufferPointer
push bufferPointer
push 1
add
store
loopEnd

moduleEnd`,
	tests: [],
};

export default bufferCombinerFloat;
