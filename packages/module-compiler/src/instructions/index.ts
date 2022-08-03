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

export default {
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
};
