import { I16_SIGNED_LARGEST_NUMBER } from './consts';

export default `
	module saw

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

	push &out
	push counter
	store
`;
