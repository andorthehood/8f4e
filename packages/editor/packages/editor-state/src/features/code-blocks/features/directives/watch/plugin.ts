import { createWatchDirectiveData } from './data';
import { createWatchDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'watch',
	(directive, draft) => {
		const watch = createWatchDirectiveData(directive.args, directive.rawRow, directive.sourceLine);
		if (!watch) {
			return;
		}

		draft.widgets.push(createWatchDirectiveWidgetContribution(watch));
	},
	{
		aliases: ['w'],
		allowTrailingComment: true,
		clearGraphicData: graphicData => {
			graphicData.widgets.debuggers = [];
		},
	}
);
