import type { ExampleModule } from '@8f4e/editor-state';

const pcmLooper8bitUnsigned: ExampleModule = {
	title: 'Variable Speed PCM Looper (8bit unsigned)',
	author: 'Andor Polgar',
	category: 'PCM',
	code: `module pcmPlayer8bitUnsigned

int8[] buffer 62258
int playhead &buffer
float out

use integerLimits

; Advance the playhead
push &playhead
push playhead
push BYTES_8
add
store

; Read sample at playhead
; write it to output
push &out
push playhead
load8u
castToFloat
push MAX_8U
castToFloat
div
store

; Reset playhead
; when reaches buffer end
push playhead
push buffer&
greaterOrEqual
if void
push &playhead
push &buffer
store
ifEnd

moduleEnd`,
	tests: [],
};

export default pcmLooper8bitUnsigned;
