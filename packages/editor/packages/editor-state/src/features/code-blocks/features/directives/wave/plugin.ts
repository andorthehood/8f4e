import { createWaveDirectiveData } from './data';
import { createWaveDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'wave',
	(directive, draft) => {
		const wave = createWaveDirectiveData(directive.args, directive.rawRow);
		if (!wave) {
			return;
		}

		draft.layoutContributions.push({ rawRow: directive.rawRow, rows: 2 });
		draft.widgets.push(createWaveDirectiveWidgetContribution(wave));
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.arrayWaves = [];
		},
	}
);
