import { createWatchDirectiveData } from './parse';
import { createWatchDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'watch',
	(directive, draft) => {
		draft.widgets.push(
			createWatchDirectiveWidgetContribution(createWatchDirectiveData(directive.args, directive.rawRow))
		);
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.debuggers = [];
		},
	}
);
