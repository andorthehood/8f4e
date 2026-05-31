import { createDirectivePlugin } from '../utils';
import { createInfoDirectiveData } from './data';
import { getInfoLayout } from './entries';
import { createInfoDirectiveWidgetContribution } from './resolve';

export default createDirectivePlugin(
	'info',
	(directive, draft) => {
		const info = createInfoDirectiveData(directive.args, directive.rawRow);
		if (!info) {
			return;
		}

		const layout = getInfoLayout(draft.state, info.id);
		draft.widgets.push(createInfoDirectiveWidgetContribution(info, layout));
		if (layout.rowCount > 0) {
			draft.layoutContributions.push({ rawRow: directive.rawRow, rows: layout.rowCount });
		}
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.infoPanels = [];
		},
	}
);
