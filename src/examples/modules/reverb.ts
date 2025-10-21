import type { ExampleModule } from '@8f4e/editor-state';

const reverb: ExampleModule = {
	title: 'Reverb',
	author: 'Andor Polgar',
	category: 'Effects',
	code: `module reverb

float* in
float out

const FEEDBACK 0.5
const SIZE 5000

float[] buffer SIZE
int bufferPointer &buffer

local float _output

debug bufferPointer
debug out

; Calculate new sample
push &out
 push bufferPointer
 loadFloat
 push FEEDBACK
 mul
 push *in
 add
store

; Store the new sample 
; in the buffer
push bufferPointer
 push &out
 loadFloat
store

; Increment buffer pointer
push &bufferPointer
 push bufferPointer
 push %bufferPointer
 add
store

; Reset buffer pointer
; it when reaches the end 
push bufferPointer
push buffer&
greaterThan
if void
 push &bufferPointer
 push &buffer
 store
ifEnd

moduleEnd`,
	tests: [],
};

export default reverb;
