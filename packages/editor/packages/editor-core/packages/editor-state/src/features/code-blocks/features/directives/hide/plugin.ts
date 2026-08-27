import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin('hide', (directive, draft) => {
	if (directive.args.length > 0) {
		return;
	}

	if (draft.displayState.hideAfterRawRow === undefined) {
		draft.displayState.hideAfterRawRow = directive.rawRow;
	}
});
