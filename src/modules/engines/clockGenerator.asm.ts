import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from './consts';
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

	push _counter
	push _rate
	greaterOrEqual
	if void
		push _output
		equalToZero
		
		if void
			push ${I16_SIGNED_LARGEST_NUMBER}
			localSet _output
		else
			push 0
			localSet _output
		end

		push 0
		localSet _counter
	else
		push _counter
		push 1
		add
		localSet _counter
	end

	pushRef out
	push _output
	store

	pushRef counter
	push _counter
	store
`;
