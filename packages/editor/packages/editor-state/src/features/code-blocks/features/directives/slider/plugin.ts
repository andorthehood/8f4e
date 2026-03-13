import { createSliderDirectiveData } from './data';
import { createSliderDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'slider',
	(directive, draft) => {
		draft.layoutContributions.push({ rawRow: directive.rawRow, rows: 2 });
		draft.widgets.push(
			createSliderDirectiveWidgetContribution(createSliderDirectiveData(directive.args, directive.rawRow))
		);
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.sliders = [];
		},
	}
);
