import { createInfoDirectiveData } from './data';
import { getInfoLayout } from './entries';
import { createInfoDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'info',
	(directive, draft) => {
		const info = createInfoDirectiveData(directive.args, directive.rawRow);
		if (!info) {
			return;
		}

		const layout = getInfoLayout(draft.state, info.id);
		if (layout.rowCount > 0) {
			draft.layoutContributions.push({ rawRow: directive.rawRow, rows: layout.rowCount });
			draft.widgets.push(createInfoDirectiveWidgetContribution(info, layout));
		}
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.infoPanels = [];
		},
	}
);
