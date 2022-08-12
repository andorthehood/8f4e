import { ModuleGenerator } from '../types';
import { compile } from '@8f4e/module-compiler';

const abs: ModuleGenerator<unknown> = function (moduleId, offset) {
	return compile(
		`
		# abs module
		
		# memory
		private DEFAULT_VALUE 0
		inputPointer in DEFAULT_VALUE
		output out 0
		
		# locals
		local input
		
		# code
		const out
		load in
		load
		localSet input
		localGet input
		const 0
		lessThan
		if 
			const 0
			localGet input
			sub
		else
			localGet input
		end
		store
	`,
		moduleId,
		offset.byte(0)
	);
};

export default abs;
