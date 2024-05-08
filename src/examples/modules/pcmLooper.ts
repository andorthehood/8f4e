import { ExampleModule } from '../../../packages/editor/src/state/types';

const pcmLooper: ExampleModule = {
	title: 'PCM Looper (8bit unsigned)',
	author: 'Andor Polgar',
	category: 'PCM',
	code: `module pcmLooper

const SIZE 8000
int[] buffer SIZE
int pointer &buffer
int out 

debug pointer
debug out

; Increment the buffer
; pointer by 1 byte
push &pointer
push pointer 
push 1
add
store 

; Buffer increments
; Resets when it reaches end
push pointer
push buffer&
greaterThan
if void
 push &pointer
 push &buffer
 store
ifEnd

; Store the value
; the pointer points to
; in the out variable
push &out
push pointer
load8u 
store

moduleEnd`,
	tests: [],
};

export default pcmLooper;
