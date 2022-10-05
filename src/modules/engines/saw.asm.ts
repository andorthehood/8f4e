import { ModuleStateExtractor, ModuleStateInserter } from './types';
import { I16_SIGNED_LARGEST_NUMBER } from './consts';

interface SawState {
	rate: number;
}

export const insertState: ModuleStateInserter<SawState> = function (state, memoryBuffer, moduleAddress) {
	memoryBuffer[moduleAddress + 1] = state.rate;
};

export const extractState: ModuleStateExtractor<SawState> = function (memoryBuffer, moduleAddress) {
	return { rate: memoryBuffer[moduleAddress + 1] };
};

export default `
	private LIMIT_SELF ${I16_SIGNED_LARGEST_NUMBER}
	public rate 1
	inputPointer in:rate rate
	inputPointer in:limit LIMIT_SELF
	output out 0
	private defaultValue 0
	inputPointer reset defaultValue

	local _rate
	local limit
	local counter

	push in:rate
	localSet _rate

	push in:limit
	localSet limit

	push out
	localSet counter

	push reset
    push 0
    greaterThan
    if void
        push 0
        localSet counter
    end

	push counter
	push limit
	greaterOrEqual
	if
		push 0
		push limit
		sub
	else
		push _rate
		push counter
		add
	end
	localSet counter

	pushRef out
	push counter
	store
`;
