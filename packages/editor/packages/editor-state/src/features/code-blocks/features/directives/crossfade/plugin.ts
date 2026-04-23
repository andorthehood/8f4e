import { createCrossfadeDirectiveData } from './data';
import { createCrossfadeDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'crossfade',
	(directive, draft) => {
		const crossfade = createCrossfadeDirectiveData(directive.args, directive.rawRow);
		if (!crossfade) {
			return;
		}

		draft.layoutContributions.push({ rawRow: directive.rawRow, rows: 2 });
		draft.widgets.push(createCrossfadeDirectiveWidgetContribution(crossfade));
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.crossfades = [];
		},
	}
);
