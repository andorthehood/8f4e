export default `module sawUnsigned8bitInt

float default 1 ;Hz 
float* frequency &default
int out

debug out

push &out
push out
castToFloat
push *frequency
push SAMPLE_RATE
castToFloat
div
push 255.0
mul
add
castToInt
store

push out
push 255
greaterThan
if void
 push &out
 push 0
 store
end

end`;
