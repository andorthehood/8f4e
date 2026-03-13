import { createPianoDirectiveData } from './data';
import { createPianoDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin(
	'piano',
	(directive, draft) => {
		const piano = createPianoDirectiveData(draft.sourceCode, directive.args, directive.rawRow);
		if (!piano) {
			return;
		}

		draft.layoutContributions.push({ rawRow: directive.rawRow, rows: 6 });
		draft.widgets.push(createPianoDirectiveWidgetContribution(piano));
	},
	{
		clearGraphicData: graphicData => {
			graphicData.widgets.pianoKeyboards = [];
			delete graphicData.minGridWidth;
		},
	}
);
