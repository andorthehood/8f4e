import { createDirectivePlugin } from '../utils';
import { createStackDirectiveWidgetContribution } from './resolve';

export default createDirectivePlugin(
	'stack',
	(directive, draft) => {
		if (directive.args.length > 0) {
			return;
		}

		draft.widgets.push(
			createStackDirectiveWidgetContribution({
				lineNumber: directive.rawRow,
				isTrailing: !/^\s*;/.test(directive.sourceLine ?? ''),
			})
		);
	},
	{ aliases: ['s'], allowTrailingComment: true }
);
