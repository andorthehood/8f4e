import { createScanDirectiveData } from './data';
import { createScanDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'scan',
	(directive, draft) => {
		draft.layoutContributions.push({ rawRow: directive.rawRow, rows: 2 });
		draft.widgets.push(
			createScanDirectiveWidgetContribution(createScanDirectiveData(directive.args, directive.rawRow))
		);
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.bufferScanners = [];
		},
	}
);
