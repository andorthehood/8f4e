import { I16_SIGNED_LARGEST_NUMBER } from './consts';

export default `module logicNegate

memory defaultValue 0
memory in &defaultValue
memory out 0

push &out
push *in
push 0
greaterThan
if
 push 0
else 
 push ${I16_SIGNED_LARGEST_NUMBER}
end

store
`;
