import { createSliderDirectiveData } from './data';
import { createSliderDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'slider',
	(directive, draft) => {
		const slider = createSliderDirectiveData(directive.args, directive.rawRow);
		if (!slider) {
			return;
		}

		draft.layoutContributions.push({ rawRow: directive.rawRow, rows: 2 });
		draft.widgets.push(createSliderDirectiveWidgetContribution(slider));
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.sliders = [];
		},
	}
);
