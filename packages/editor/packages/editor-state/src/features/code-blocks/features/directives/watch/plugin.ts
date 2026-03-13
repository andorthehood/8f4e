import { createWatchDirectiveData } from './data';
import { createWatchDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'watch',
	(directive, draft) => {
		const watch = createWatchDirectiveData(directive.args, directive.rawRow);
		if (!watch) {
			return;
		}

		draft.widgets.push(createWatchDirectiveWidgetContribution(watch));
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.debuggers = [];
		},
	}
);
