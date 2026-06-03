import abs from './abs';
import add from './add';
import and from './and';
import block from './block';
import blockEnd from './blockEnd';
import branch from './branch';
import branchIfTrue from './branchIfTrue';
import branchIfUnchanged from './branchIfUnchanged';
import call from './call';
import castToFloat from './castToFloat';
import castToFloat64 from './castToFloat64';
import castToInt from './castToInt';
import { clampAddress, clampGlobalAddress, clampModuleAddress } from './clampAddress';
import clearStack from './clearStack';
import _default from './default';
import div from './div';
import drop from './drop';
import _else from './else';
import ensureNonZero from './ensureNonZero';
import equal from './equal';
import equalToZero from './equalToZero';
import exitIfTrue from './exitIfTrue';
import exportFunction from './exportFunction';
import fallingEdge from './fallingEdge';
import _function from './function';
import functionEnd from './functionEnd';
import greaterOrEqual from './greaterOrEqual';
import greaterOrEqualUnsigned from './greaterOrEqualUnsigned';
import greaterThan from './greaterThan';
import hasChanged from './hasChanged';
import _if from './if';
import ifEnd from './ifEnd';
import importFunction from './importFunction';
import impure from './impure';
import lessOrEqual from './lessOrEqual';
import lessThan from './lessThan';
import load from './load';
import loadFloat from './loadFloat';
import local from './local';
import localSet from './localSet';
import loop from './loop';
import loopCap from './loopCap';
import loopEnd from './loopEnd';
import loopIndex from './loopIndex';
import map from './map';
import mapBegin from './mapBegin';
import mapEnd from './mapEnd';
import max from './max';
import memoryCopy from './memoryCopy';
import min from './min';
import mul from './mul';
import notEqual from './notEqual';
import notZero from './notZero';
import or from './or';
import param from './param';
import push from './push';
import remainder from './remainder';
import _return from './return';
import risingEdge from './risingEdge';
import round from './round';
import shiftLeft from './shiftLeft';
import shiftRight from './shiftRight';
import shiftRightUnsigned from './shiftRightUnsigned';
import skipExecution from './skipExecution';
import sqrt from './sqrt';
import store from './store';
import storeBytes from './storeBytes';
import sub from './sub';
import xor from './xor';

const instructions = {
	and,
	or,
	load: load,
	load8u: load,
	load16u: load,
	load8s: load,
	load16s: load,
	clampAddress,
	clampModuleAddress,
	clampGlobalAddress,
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
	min,
	max,
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
	abs,
	equal,
	branchIfUnchanged,
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
	'#impure': impure,
	'#export': exportFunction,
	'#import': importFunction,
	'#loopCap': loopCap,
	mapBegin,
	map,
	default: _default,
	mapEnd,
	storeBytes,
	memoryCopy,
} as const;

export default instructions;

/** Instruction names with registered codegen handlers. */
export type Instruction = keyof typeof instructions;
