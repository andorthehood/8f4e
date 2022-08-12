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
};
