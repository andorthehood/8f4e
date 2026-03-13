import { createButtonDirectiveData } from './data';
import { createButtonDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'button',
	(directive, draft) => {
		draft.widgets.push(
			createButtonDirectiveWidgetContribution(createButtonDirectiveData(directive.args, directive.rawRow))
		);
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.buttons = [];
		},
	}
);
