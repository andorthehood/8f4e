import _const from './const';
import load from './load';
import localGet from './localGet';
import localSet from './localSet';
import _else from './else';
import end from './end';
import store from './store';
import sub from './sub';
import _if from './if';
import lessThan from './lessThan';
import div from './div';
import and from './and';
import or from './or';
import xor from './xor';
import _private from './private';
import inputPointer from './inputPointer';
import output from './output';
import local from './local';
import _public from './public';
import greaterOrEqual from './greaterOrEqual';
import add from './add';
import greaterThan from './greaterThan';
import branch from './branch';
import branchIfTrue from './branchIfTrue';
import push from './push';
import block from './block';
import lessOrEqual from './lessOrEqual';
import mul from './mul';
import loop from './loop';
import loopEnd from './loopEnd';
import greaterOrEqualUnsigned from './greaterOrEqualUnsigned';
import array from './array';
import equalToZero from './equalToZero';
import shiftRightUnsigned from './shiftRightUnsigned';
import shiftRight from './shiftRight';
import remainder from './remainder';
import pointerForward from './pointerForward';

import { InstructionHandler } from '../types';

export default {
	and,
	or,
	const: _const,
	load,
	localGet,
	localSet,
	else: _else,
	if: _if,
	lessThan,
	end,
	store,
	sub,
	div,
	xor,
	private: _private,
	inputPointer,
	output,
	local,
	public: _public,
	greaterOrEqual,
	add,
	greaterThan,
	branch,
	branchIfTrue,
	push,
	block,
	lessOrEqual,
	mul,
	loop,
	loopEnd,
	greaterOrEqualUnsigned,
	array,
	equalToZero,
	shiftRight,
	shiftRightUnsigned,
	remainder,
	pointerForward,
} as Record<string, InstructionHandler>;
