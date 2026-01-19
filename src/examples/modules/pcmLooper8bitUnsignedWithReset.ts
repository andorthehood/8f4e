import type { ExampleModule } from '@8f4e/editor-state';

const pcmLooper8bitUnsigned: ExampleModule = {
	title: 'Variable Speed PCM Looper with Reset (8bit unsigned)',
	author: 'Andor Polgar',
	category: 'PCM',
	dependencies: ['integerLimits'],
	code: `module pcmPlayer8bit

int8[] buffer 62258
int playhead &buffer
float out
int startPos 
int* reset

use integerLimits

; Read sample at playhead
; write it to output
push &out
push playhead
load8u
castToFloat
push MAX_8U
castToFloat
div
push 0.5
sub
store

; Advance the playhead
push &playhead
push playhead
push BYTES_8
add
store

; Reset playhead
; when reaches buffer end
push playhead
push buffer&
greaterThan
; when reset signal
push *reset
risingEdge
or
if void
push &playhead
push &buffer
push startPos
add
store
ifEnd

moduleEnd`,
	tests: [],
};

export default pcmLooper8bitUnsigned;
