import { I16_SIGNED_LARGEST_NUMBER } from './consts';

const tapPositions = [0, 2, 3, 5];

export default ({ seed = 69420 } = {}) => `
	module random

	private seed ${seed}
	output out 0

	local random
	local feedback

	push out
	localSet random

	localGet random
	# The zero state is illegal because the counter would remain locked-up.
	equalToZero
	if 
		push seed
	else
		push random
	end
	localSet random

	${tapPositions
		.map(
			position => `
		push random
		push ${1 << position}
		and
		push ${position}
		shiftRight
		push feedback
		xor
		localSet feedback
	`
		)
		.join('\n')}

	push random
	push 1
	shiftRightUnsigned
	localSet random

	push feedback
	equalToZero
	if 
		push random
	else
		push random
		push ${0b10000000000000000000000000000000}
		or
	end
	localSet random

	push &out
	push random
	push ${I16_SIGNED_LARGEST_NUMBER}
	remainder
	store
`;
