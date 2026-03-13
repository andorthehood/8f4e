import { createPlotDirectiveData } from './data';
import { createPlotDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'plot',
	(directive, draft) => {
		const plot = createPlotDirectiveData(directive.args, directive.rawRow);
		if (!plot) {
			return;
		}

		draft.layoutContributions.push({ rawRow: directive.rawRow, rows: 8 });
		draft.widgets.push(createPlotDirectiveWidgetContribution(plot));
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.bufferPlotters = [];
		},
	}
);
