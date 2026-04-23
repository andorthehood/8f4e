import { createBarsDirectiveData } from './data';
import { createBarsDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'bars',
	(directive, draft) => {
		const bars = createBarsDirectiveData(directive.args, directive.rawRow);
		if (!bars) {
			return;
		}

		draft.layoutContributions.push({ rawRow: directive.rawRow, rows: 8 });
		draft.widgets.push(createBarsDirectiveWidgetContribution(bars));
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.arrayBars = [];
		},
	}
);
