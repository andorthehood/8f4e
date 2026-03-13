import { createPianoDirectiveData } from './data';
import { createPianoDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'piano',
	(directive, draft) => {
		draft.layoutContributions.push({ rawRow: directive.rawRow, rows: 6 });
		draft.widgets.push(
			createPianoDirectiveWidgetContribution(
				createPianoDirectiveData(draft.sourceCode, directive.args, directive.rawRow)
			)
		);
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.pianoKeyboards = [];
			delete graphicData.minGridWidth;
		},
	}
);
