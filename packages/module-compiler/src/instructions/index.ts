import constInstruction from './const';
import load from './load';
import localGet from './localGet';
import localSet from './localSet';
import elseInstruction from './else';
import end from './end';
import store from './store';
import sub from './sub';
import ifInstruction from './if';
import lessThan from './lessThan';
import div from './div';
import and from './and';
import or from './or';
import xor from './xor';

export default {
	and,
	or,
	const: constInstruction,
	load,
	localGet,
	localSet,
	else: elseInstruction,
	if: ifInstruction,
	lessThan,
	end,
	store,
	sub,
	div,
	xor,
};
