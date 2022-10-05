import { I16_SIGNED_LARGEST_NUMBER } from './consts';
import { ModuleStateExtractor, ModuleStateInserter } from './types';

interface ClockGeneratorState {
	rate: number;
}

export const insertState: ModuleStateInserter<ClockGeneratorState> = function (state, memoryBuffer, moduleAddress) {
	memoryBuffer[moduleAddress + 1] = state.rate;
};

export const extractState: ModuleStateExtractor<ClockGeneratorState> = function (memoryBuffer, moduleAddress) {
	return { rate: memoryBuffer[moduleAddress + 1] };
};

export default `
	private counter 0
	public rate 0
	output out 0

	local _counter
	local _output
	local _rate

	push out
	localSet _output

	push counter
	localSet _counter

	push rate
	localSet _rate

    # Resets the output to 0
    push _output
    push ${I16_SIGNED_LARGEST_NUMBER}
    greaterOrEqual
    if void
        push 0
        localSet _output
    end

	push _counter
	push _rate
	greaterOrEqual
	if
		push ${I16_SIGNED_LARGEST_NUMBER}	
		localSet _output

		push 0
	else
		push _counter
		push 1
		add
	end

	localSet _counter

	pushRef out
	push _output
	store

	pushRef counter
	push _counter
	store
`;
