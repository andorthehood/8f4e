import { createSwitchDirectiveData } from './data';
import { createSwitchDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'switch',
	(directive, draft) => {
		const _switch = createSwitchDirectiveData(directive.args, directive.rawRow);
		if (!_switch) {
			return;
		}

		draft.widgets.push(createSwitchDirectiveWidgetContribution(_switch));
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.switches = [];
		},
	}
);
