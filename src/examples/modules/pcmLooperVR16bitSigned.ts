import { ExampleModule } from '../../../packages/editor/src/state/types';

const pcmLooperVR16bitSigned: ExampleModule = {
	title: 'Variable Speed and Retriggerable PCM Looper (16bit signed)',
	author: 'Andor Polgar',
	category: 'PCM',
	code: `module pcmLooper
; Variable Speed and
; Retriggerable PCM Looper

int16[] buffer 914066
float playhead 0
int out 1
float defSpeed 1
int defLength $buffer
int* reset 
int* length &defLength
float* speed &defSpeed
debug playhead
debug out

; Reset playhead
push *reset
risingEdge
if void
 push &playhead
 push 0.0
 store
ifEnd

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

export default pcmLooperVR16bitSigned;
