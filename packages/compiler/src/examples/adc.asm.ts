import { I16_SIGNED_LARGEST_NUMBER, LOGIC_HIGH, LOGIC_LOW } from './consts';

const masks = [
	0b0000000000000001, 0b0000000000000010, 0b0000000000000100, 0b0000000000001000, 0b0000000000010000,
	0b0000000000100000, 0b0000000001000000, 0b0000000010000000, 0b0000000100000000, 0b0000001000000000,
	0b0000010000000000, 0b0000100000000000, 0b0001000000000000, 0b0010000000000000, 0b0100000000000000,
	0b1000000000000000,
];

export interface Config {
	resolution: number;
}

export default ({ resolution = 8 } = {}) => `module adc

; memory
int default 0
int* in &default

${masks
	.slice(0, resolution)
	.map((mask, index) => `int out:${index + 1} 0`)
	.join('\n')}

; locals
local int input

; code
push *in
push ${resolution === 16 ? 1 : Math.floor(I16_SIGNED_LARGEST_NUMBER / (Math.pow(2, resolution) - 1))}
div
localSet input

${masks
	.slice(0, resolution)
	.map(
		(mask, index) => `
push &out:${index + 1}
push input
push ${mask}
and
push 0
greaterThan
if 
 push ${LOGIC_HIGH}
else
 push ${LOGIC_LOW}
 ifEnd
store
`
	)
	.join('\n')}

moduleEnd
`;
