import type { ExampleModule } from '@8f4e/editor-state';

const bufferCombinerInt: ExampleModule = {
	title: 'Buffer Combiner (Int)',
	author: 'Andor Polgar',
	category: 'Buffer',
	code: `module bufferCombiner

int* bufferA
int* lengthA
int* bufferB
int* lengthB

int[] buffer 16
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
push %buffer
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
push %bufferA
mul
add
else
push bufferB
push bufferPointer
push *lengthA
sub
push %bufferB
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

export default bufferCombinerInt;
