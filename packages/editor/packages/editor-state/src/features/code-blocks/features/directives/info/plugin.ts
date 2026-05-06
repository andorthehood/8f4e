import { createInfoDirectiveData } from './data';
import { getInfoEntryCount } from './entries';
import { createInfoDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'info',
	(directive, draft) => {
		const info = createInfoDirectiveData(directive.args, directive.rawRow);
		if (!info) {
			return;
		}

		const rowCount = getInfoEntryCount(draft.state, info.id);
		if (rowCount > 0) {
			draft.layoutContributions.push({ rawRow: directive.rawRow, rows: rowCount });
			draft.widgets.push(createInfoDirectiveWidgetContribution(info));
		}
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.infoPanels = [];
		},
	}
);
