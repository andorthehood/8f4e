import _const from './const';
import load from './load';
import localGet from './localGet';
import localSet from './localSet';
import _else from './else';
import store from './store';
import sub from './sub';
import _if from './if';
import ifEnd from './ifEnd';
import lessThan from './lessThan';
import div from './div';
import and from './and';
import or from './or';
import xor from './xor';
import local from './local';
import greaterOrEqual from './greaterOrEqual';
import add from './add';
import greaterThan from './greaterThan';
import branch from './branch';
import branchIfTrue from './branchIfTrue';
import push from './push';
import block from './block';
import blockEnd from './blockEnd';
import lessOrEqual from './lessOrEqual';
import mul from './mul';
import loop from './loop';
import loopEnd from './loopEnd';
import greaterOrEqualUnsigned from './greaterOrEqualUnsigned';
import equalToZero from './equalToZero';
import shiftRightUnsigned from './shiftRightUnsigned';
import shiftRight from './shiftRight';
import remainder from './remainder';
import _module from './module';
import moduleEnd from './moduleEnd';
import memory from './memory';
import castToInt from './castToInt';
import castToFloat from './castToFloat';
import skip from './skip';
import buffer from './buffer';
import drop from './drop';
import clearStack from './clearStack';
import risingEdge from './risingEdge';
import fallingEdge from './fallingEdge';
import hasChanged from './hasChanged';
import dup from './dup';
import swap from './swap';
import cycle from './cycle';
import abs from './abs';
import use from './use';
import equal from './equal';
import wasm from './wasm';
import branchIfUnchanged from './branchIfUnchanged';
import init from './init';
import shiftLeft from './shiftLeft';
import pow2 from './pow2';
import sqrt from './sqrt';
import loadFloat from './loadFloat';
import round from './round';
import ensureNonZero from './ensureNonZero';
import _function from './function';
import functionEnd from './functionEnd';
import param from './param';
import initBlock from './initBlock';
import initBlockEnd from './initBlockEnd';
import call from './call';

const instructions = {
	and,
	or,
	const: _const,
	load: load,
	load8u: load,
	load16u: load,
	load8s: load,
	load16s: load,
	localGet,
	localSet,
	else: _else,
	if: _if,
	ifEnd,
	lessThan,
	store,
	sub,
	div,
	xor,
	local,
	greaterOrEqual,
	add,
	greaterThan,
	branch,
	branchIfTrue,
	push,
	block,
	blockEnd,
	lessOrEqual,
	mul,
	loop,
	loopEnd,
	greaterOrEqualUnsigned,
	equalToZero,
	shiftLeft,
	shiftRight,
	shiftRightUnsigned,
	remainder,
	module: _module,
	moduleEnd,
	int: memory,
	float: memory,
	'int*': memory,
	'int**': memory,
	'float*': memory,
	'float**': memory,
	'float[]': buffer,
	'int[]': buffer,
	'int8[]': buffer,
	'int16[]': buffer,
	'int32[]': buffer,
	'float*[]': buffer,
	'float**[]': buffer,
	'int*[]': buffer,
	'int**[]': buffer,
	castToInt,
	castToFloat,
	skip,
	drop,
	clearStack,
	risingEdge,
	fallingEdge,
	hasChanged,
	dup,
	swap,
	cycle,
	abs,
	use,
	equal,
	wasm,
	branchIfUnchanged,
	init,
	pow2,
	sqrt,
	loadFloat,
	round,
	ensureNonZero,
	function: _function,
	functionEnd,
	param,
	initBlock,
	initBlockEnd,
	call,
} as const;

export default instructions;

export type Instruction = keyof typeof instructions;
