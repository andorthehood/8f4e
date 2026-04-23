import load from './load';
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
import exitIfTrue from './exitIfTrue';
import push from './push';
import block from './block';
import blockEnd from './blockEnd';
import lessOrEqual from './lessOrEqual';
import mul from './mul';
import loop from './loop';
import loopIndex from './loopIndex';
import loopEnd from './loopEnd';
import greaterOrEqualUnsigned from './greaterOrEqualUnsigned';
import equalToZero from './equalToZero';
import notEqual from './notEqual';
import notZero from './notZero';
import shiftRightUnsigned from './shiftRightUnsigned';
import shiftRight from './shiftRight';
import remainder from './remainder';
import castToInt from './castToInt';
import castToFloat from './castToFloat';
import castToFloat64 from './castToFloat64';
import drop from './drop';
import clearStack from './clearStack';
import risingEdge from './risingEdge';
import fallingEdge from './fallingEdge';
import hasChanged from './hasChanged';
import dup from './dup';
import swap from './swap';
import cycle from './cycle';
import abs from './abs';
import equal from './equal';
import wasm from './wasm';
import branchIfUnchanged from './branchIfUnchanged';
import shiftLeft from './shiftLeft';
import pow2 from './pow2';
import sqrt from './sqrt';
import loadFloat from './loadFloat';
import round from './round';
import ensureNonZero from './ensureNonZero';
import _function from './function';
import functionEnd from './functionEnd';
import _return from './return';
import param from './param';
import call from './call';
import skipExecution from './skipExecution';
import initOnly from './initOnly';
import impure from './impure';
import loopCap from './loopCap';
import mapBegin from './mapBegin';
import map from './map';
import _default from './default';
import mapEnd from './mapEnd';
import storeBytes from './storeBytes';

const instructions = {
	and,
	or,
	load: load,
	load8u: load,
	load16u: load,
	load8s: load,
	load16s: load,
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
	exitIfTrue,
	push,
	block,
	blockEnd,
	lessOrEqual,
	mul,
	loop,
	loopIndex,
	loopEnd,
	greaterOrEqualUnsigned,
	equalToZero,
	notEqual,
	notZero,
	shiftLeft,
	shiftRight,
	shiftRightUnsigned,
	remainder,
	castToInt,
	castToFloat,
	castToFloat64,
	drop,
	clearStack,
	risingEdge,
	fallingEdge,
	hasChanged,
	dup,
	swap,
	cycle,
	abs,
	equal,
	wasm,
	branchIfUnchanged,
	pow2,
	sqrt,
	loadFloat,
	round,
	ensureNonZero,
	function: _function,
	functionEnd,
	return: _return,
	param,
	call,
	'#skipExecution': skipExecution,
	'#initOnly': initOnly,
	'#impure': impure,
	'#loopCap': loopCap,
	mapBegin,
	map,
	default: _default,
	mapEnd,
	storeBytes,
} as const;

export default instructions;

export type Instruction = keyof typeof instructions;
