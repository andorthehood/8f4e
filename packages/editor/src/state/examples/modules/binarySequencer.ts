export default `module binaryGateSequencer

int step1 0b00010000
int step2 0b00100000
int step3 0b01000000
int tesp4 0b10000000
int step5 0b00000001
int step6 0b11111111
int step7 0b00000000
int last_ 0b10101001

int* stepPointer &step1
int* trigger

int out1
int out2
int out3 
int out4
int out5 
int out6
int out7 
int out8 

int bitPointer 0

const HIGH 100
const LOW 0

push *trigger
risingEdge
if void
 push &stepPointer
 push &step1
 push &last_
 cycle
end

push &bitPointer
push bitPointer
push 1
add
store

push bitPointer
push 8
equal
if void
 push &bitPointer
 push 0
 store
end

; Calculate output address
push &out1
push bitPointer
push 4
mul
add

push *stepPointer
push 0b10000000
push bitPointer
shiftRight
and
if int
 push HIGH
else
 push LOW
end 

store

end`;
