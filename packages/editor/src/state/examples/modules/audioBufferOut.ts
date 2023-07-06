export default `module audioBufferOut

float* in
int channel 0

; Audio buffer
float[] buffer 128 0
int pointer &buffer
debug pointer
debug buffer

; Increment the buffer 
; pointer by the word size
push &pointer
push pointer
push WORD_SIZE
add
store

; Reset the buffer pointer
; when it reaches the end
; of the buffer
push pointer
push buffer&
greaterThan
if void
 push &pointer
 push &buffer
 store
end

; Store the input value
; in the buffer
push pointer
push *in
store
end`;
