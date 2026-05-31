import { createDirectivePlugin } from '../utils';

const hiddenDirective = createDirectivePlugin('hidden', (directive, draft) => {
	if (directive.args.length > 0) {
		return;
	}

	draft.blockState.hidden = true;
});

export default hiddenDirective;
