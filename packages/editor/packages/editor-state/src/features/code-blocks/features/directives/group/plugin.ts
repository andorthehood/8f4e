import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin('group', (directive, draft) => {
	// Only process the first @group directive, matching the original parser behaviour
	if (draft.blockState.groupName !== undefined) {
		return;
	}
	const [groupName, secondArg] = directive.args;
	if (!groupName) {
		return;
	}
	draft.blockState.groupName = groupName;
	draft.blockState.groupNonstick = secondArg === 'nonstick';
});
