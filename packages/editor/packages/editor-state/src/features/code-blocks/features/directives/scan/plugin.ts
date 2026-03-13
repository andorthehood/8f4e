import { createScanDirectiveData } from './data';
import { createScanDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'scan',
	(directive, draft) => {
		const scan = createScanDirectiveData(directive.args, directive.rawRow);
		if (!scan) {
			return;
		}

		draft.layoutContributions.push({ rawRow: directive.rawRow, rows: 2 });
		draft.widgets.push(createScanDirectiveWidgetContribution(scan));
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.bufferScanners = [];
		},
	}
);
