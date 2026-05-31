import { createDirectivePlugin } from '../utils';
import { createButtonDirectiveData } from './data';
import { createButtonDirectiveWidgetContribution } from './resolve';

export default createDirectivePlugin(
	'button',
	(directive, draft) => {
		const button = createButtonDirectiveData(directive.args, directive.rawRow);
		if (!button) {
			return;
		}

		draft.widgets.push(createButtonDirectiveWidgetContribution(button));
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.buttons = [];
		},
	}
);
