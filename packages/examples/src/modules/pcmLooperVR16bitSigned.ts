import type { ExampleModule } from '@8f4e/editor-state';

const pcmLooperVR16bitSigned: ExampleModule = {
	title: 'Variable Speed and Retriggerable PCM Looper (16bit signed)',
	author: 'Andor Polgar',
	category: 'PCM',
	code: `module pcmLooper
; Variable Speed and
; Retriggerable PCM Looper

int16[] buffer 914066
float playhead 0
float out 1.0
float defSpeed 1
int defLength $buffer
int* reset
int* length &defLength
float* speed &defSpeed

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

; Load value from buffer
; and save it to the output
push &out
push playhead
castToInt
push %buffer
mul
push &buffer
add
load16s
 ; Normalize value
castToFloat
push ^buffer
castToFloat
div
store

moduleEnd`,
	tests: [],
};

export default pcmLooperVR16bitSigned;
