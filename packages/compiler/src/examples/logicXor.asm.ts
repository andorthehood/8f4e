import { I16_SIGNED_LARGEST_NUMBER } from './consts';

export default `module logicXor

memory defaultValue 0
memory in:1 &defaultValue
memory in:2 &defaultValue
memory out 0

const HIGH ${I16_SIGNED_LARGEST_NUMBER}

block void
 push *in:1
 push 0
 greaterThan
 if void
  push *in:2
  push 0
  greaterThan
  branchIfTrue 1
 else
  push *in:2
  push 0
  lessOrEqual
  branchIfTrue 1
 end

 push &out
 push HIGH
 store
 branch 1
end

push &out
push 0
store
`;
