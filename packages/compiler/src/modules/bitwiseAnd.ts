import { compile } from '@8f4e/module-compiler';
import { ModuleGenerator } from '../types';

const bitwiseAnd: ModuleGenerator<unknown> = function (moduleId, offset) {
	return compile(
		`private default1 0
		private default2 0
		inputPointer in:1 default1
		inputPointer in:2 default2
		output out 0
		
		const out
		const in:1
		load
		load
		const in:2
		load
		loa3
		and
		store`,
		moduleId,
		offset.byte(0)
	);
};

export default bitwiseAnd;
