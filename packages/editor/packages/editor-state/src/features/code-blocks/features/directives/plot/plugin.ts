import { createPlotDirectiveData } from './parse';
import { createPlotDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'plot',
	(directive, draft) => {
		draft.layoutContributions.push({ rawRow: directive.rawRow, rows: 8 });
		draft.widgets.push(
			createPlotDirectiveWidgetContribution(createPlotDirectiveData(directive.args, directive.rawRow))
		);
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.bufferPlotters = [];
		},
	}
);
