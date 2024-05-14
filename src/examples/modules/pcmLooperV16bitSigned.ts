import { ExampleModule } from '../../../packages/editor/src/state/types';

const pcmLooperV16bitSigned: ExampleModule = {
	title: 'Variable Speed PCM Looper (16bit signed)',
	author: 'Andor Polgar',
	category: 'PCM',
	code: `module pcmLooper
; Variable speed PCM Looper

int16[] buffer 128890
float playhead 0
int out 1
float defSpeed 0.5
int defLength $buffer
int* length &defLength
float* speed &defSpeed
debug playhead
debug out

; Playhead increments
push &playhead
push playhead 
push *speed
add
store 

; Resets when it reaches end
push playhead
castToInt
push *length
greaterThan
if void
 push &playhead
 push 0
 store
ifEnd

push &out
 push playhead
 castToInt
 push %buffer
 mul
 push &buffer
 add
 load16s
store

moduleEnd`,
	tests: [],
};

export default pcmLooperV16bitSigned;
