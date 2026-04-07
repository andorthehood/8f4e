import { createNthDirectiveData } from './data';
import { createNthDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'nth',
	(directive, draft) => {
		const nth = createNthDirectiveData(directive.args, directive.rawRow);
		if (!nth) {
			return;
		}

		draft.widgets.push(createNthDirectiveWidgetContribution(nth));
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.debuggers = [];
		},
	}
);
