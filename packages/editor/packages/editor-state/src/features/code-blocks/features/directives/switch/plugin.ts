import { createSwitchDirectiveData } from './parse';
import { createSwitchDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'switch',
	(directive, draft) => {
		draft.widgets.push(
			createSwitchDirectiveWidgetContribution(createSwitchDirectiveData(directive.args, directive.rawRow))
		);
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.switches = [];
		},
	}
);
