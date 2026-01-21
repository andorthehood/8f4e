import type { ExampleModule } from '@8f4e/editor-state';

const pcmLooper8bitUnsigned: ExampleModule = {
	title: 'Variable Speed PCM Looper with Reset (8bit unsigned)',
	author: 'Andor Polgar',
	category: 'PCM',
	dependencies: [],
	code: `module pcmPlayer8bit

int8[] buffer 62258
int playhead &buffer
float out
int startPos 
int* reset

; Read sample at playhead
; write it to output
push &out
push playhead
load8u
castToFloat
push ^buffer
push !buffer
sub
castToFloat
div
push 0.5
sub
store

; Advance the playhead
push &playhead
push playhead
push %buffer
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
