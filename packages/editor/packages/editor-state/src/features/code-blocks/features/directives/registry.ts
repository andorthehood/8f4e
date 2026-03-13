import buttonDirective from './button/plugin';
import disabledDirective from './disabled/plugin';
import homeDirective from './home/plugin';
import pianoDirective from './piano/plugin';
import plotDirective from './plot/plugin';
import scanDirective from './scan/plugin';
import sliderDirective from './slider/plugin';
import switchDirective from './switch/plugin';
import watchDirective from './watch/plugin';
import { parseEditorDirectives } from './utils';

import buildDisplayModel from '../graphicHelper/buildDisplayModel';

import type { CodeBlockGraphicData, State } from '~/types';
import type { DirectiveDerivedState, DirectiveDerivedStateDraft, EditorDirectivePlugin } from './types';

export type {
	ParsedEditorDirective,
	DirectiveLayoutContribution,
	DirectiveBlockState,
	DirectiveDerivedState,
} from './types';

export const directivePlugins: EditorDirectivePlugin[] = [
	plotDirective,
	scanDirective,
	sliderDirective,
	pianoDirective,
	buttonDirective,
	switchDirective,
	watchDirective,
	disabledDirective,
	homeDirective,
];

export function deriveDirectiveState(
	code: string[],
	plugins: EditorDirectivePlugin[] = directivePlugins
): DirectiveDerivedState {
	const directives = parseEditorDirectives(code, plugins);
	const draft: DirectiveDerivedStateDraft = {
		sourceCode: code,
		blockState: {
			disabled: false,
			isHome: false,
		},
		displayModel: buildDisplayModel(code),
		layoutContributions: [],
		widgets: [],
	};

	for (const directive of directives) {
		const plugin = plugins.find(candidate => candidate.name === directive.name);
		plugin?.apply?.(directive, draft);
	}

	return {
		blockState: draft.blockState,
		displayModel: draft.displayModel,
		layoutContributions: draft.layoutContributions,
		widgets: draft.widgets,
	};
}

export function runAfterGraphicDataWidthCalculation(
	graphicData: CodeBlockGraphicData,
	state: State,
	directiveState: DirectiveDerivedState
): void {
	directiveState.widgets.forEach(widget => {
		widget.afterGraphicDataWidthCalculation?.(graphicData, state, directiveState);
	});
}

export function runBeforeGraphicDataWidthCalculation(
	graphicData: CodeBlockGraphicData,
	state: State,
	directiveState: DirectiveDerivedState,
	plugins: EditorDirectivePlugin[] = directivePlugins
): void {
	plugins.forEach(plugin => {
		plugin.clearGraphicData?.(graphicData);
	});

	directiveState.widgets.forEach(widget => {
		widget.beforeGraphicDataWidthCalculation?.(graphicData, state, directiveState);
	});
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('directive registry', () => {
		it('parses registered directives from code', () => {
			const result = parseEditorDirectives(
				['module foo', '; @plot buffer -1 1', '; @slider gain 0 1 0.01', '; note', 'moduleEnd'],
				directivePlugins
			);

			expect(result).toEqual([
				{ name: 'plot', rawRow: 1, args: ['buffer', '-1', '1'] },
				{ name: 'slider', rawRow: 2, args: ['gain', '0', '1', '0.01'] },
			]);
		});

		it('derives block state and layout in a single pass', () => {
			const result = deriveDirectiveState([
				'module foo',
				'; @disabled',
				'; @home',
				'; @plot buffer',
				'; @scan buffer pointer',
				'moduleEnd',
			]);

			expect(result.blockState).toEqual({
				disabled: true,
				isHome: true,
			});
			expect(result.layoutContributions).toEqual([
				{ rawRow: 3, rows: 8 },
				{ rawRow: 4, rows: 2 },
			]);
			expect(result.displayModel.displayRowToRawRow).toEqual([0, 1, 2, 3, 4, 5]);
		});

		it('ignores unregistered directives', () => {
			const result = deriveDirectiveState(['; @favorite', '; @home', '; @plot buffer']);

			expect(result.blockState).toEqual({
				disabled: false,
				isHome: true,
			});
			expect(result.layoutContributions).toEqual([{ rawRow: 2, rows: 8 }]);
		});
	});
}
