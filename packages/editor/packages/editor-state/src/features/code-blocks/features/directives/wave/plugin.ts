import { createWaveDirectiveData } from './data';
import { createWaveDirectiveWidgetContribution } from './resolve';

import { createDirectivePlugin } from '../utils';

function createWaveDirectivePlugin(name: string, heightRows: number) {
	return createDirectivePlugin(
		name,
		(directive, draft) => {
			const wave = createWaveDirectiveData(directive.args, directive.rawRow, heightRows);
			if (!wave) {
				return;
			}

			draft.layoutContributions.push({ rawRow: directive.rawRow, rows: heightRows });
			draft.widgets.push(createWaveDirectiveWidgetContribution(wave));
		},
		{
			clearGraphicData: graphicData => {
				graphicData.widgets.arrayWaves = [];
			},
		}
	);
}

export const waveDirective = createWaveDirectivePlugin('wave', 2);
export const wave2Directive = createWaveDirectivePlugin('wave2', 4);

export default waveDirective;
