export default `module splitter

int zero 0
int* in &zero
int out:1 &zero
int out:2 &zero
int out:3 &zero
int out:4 &zero

local int input

push *in
localSet input

push &out:1
push input
store

push &out:2
push input
store

push &out:3
push input
store

push &out:4
push input
store

end
`;
