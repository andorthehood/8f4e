import { createDirectivePlugin } from '../utils';
import { createDebugDirectiveWidgetContribution } from './resolve';

export default createDirectivePlugin(
	'debug',
	(directive, draft) => {
		if (directive.args.length > 0) {
			return;
		}

		draft.widgets.push(
			createDebugDirectiveWidgetContribution({
				lineNumber: directive.rawRow,
				isTrailing: !/^\s*;/.test(directive.sourceLine ?? ''),
			})
		);
	},
	{ allowTrailingComment: true }
);
