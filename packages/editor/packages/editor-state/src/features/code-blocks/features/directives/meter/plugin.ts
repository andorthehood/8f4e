import { createMeterDirectiveData } from './data';
import { createMeterDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'meter',
	(directive, draft) => {
		const meter = createMeterDirectiveData(directive.args, directive.rawRow, directive.sourceLine);
		if (!meter) {
			return;
		}

		draft.layoutContributions.push({ rawRow: directive.rawRow, rows: 1 });
		draft.widgets.push(createMeterDirectiveWidgetContribution(meter));
	},
	{
		allowTrailingComment: true,
		clearGraphicData: graphicData => {
			graphicData.widgets.arrayMeters = [];
		},
	}
);
