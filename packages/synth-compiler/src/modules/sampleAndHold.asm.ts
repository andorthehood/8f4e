export default `
	private defaultValue 0
	inputPointer in defaultValue
	inputPointer in:trigger defaultValue
	private triggerPreviousValue 0
	output out 0

	local triggerInput

	push in:trigger
	localSet triggerInput

	push triggerInput
	push triggerPreviousValue
	sub
	push 1000
	greaterOrEqual
	if void
		pushRef out
		push in
		store
	end

	pushRef triggerPreviousValue
	push triggerInput
	store
`;
