import { ModuleGenerator, ModuleStateInserter, ModuleStateExtractor, MemoryTypes } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';
import { compile } from '@8f4e/module-compiler';

interface SawState {
	rate: number;
}

export const insertState: ModuleStateInserter<SawState> = function (state, memoryBuffer, moduleAddress) {
	memoryBuffer[moduleAddress + 1] = state.rate;
};

export const extractState: ModuleStateExtractor<SawState> = function (memoryBuffer, moduleAddress) {
	return { rate: memoryBuffer[moduleAddress + 1] };
};

const saw: ModuleGenerator<{ rate?: number }> = function (moduleId, offset, { rate = 1 } = {}) {
	return compile(
		`
		private LIMIT_SELF ${I16_SIGNED_LARGEST_NUMBER}
		public rate ${rate}
		inputPointer in:rate rate
		inputPointer in:limit LIMIT_SELF
		output out 0
		
		local rate
		local limit
		local counter

		load in:rate
		load
		localSet rate

		load in:limit
		load
		localSet limit

		load out
		localSet counter

		localGet counter
		localGet limit
		greaterOrEqual
		if
			const 0
			localGet limit
			sub
		else
			localGet rate
			localGet counter
			add
		end
		localSet counter

		const out
		localGet counter
		store
	`,
		moduleId,
		offset.byte(0)
	);
};

export default saw;
