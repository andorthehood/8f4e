import buttonDirective from './button/plugin';
import disabledDirective from './disabled/plugin';
import favoriteDirective from './favorite/plugin';
import groupDirective from './group/plugin';
import hideDirective from './hide/plugin';
import homeDirective from './home/plugin';
import opacityDirective from './opacity/plugin';
import pianoDirective from './piano/plugin';
import plotDirective from './plot/plugin';
import scanDirective from './scan/plugin';
import sliderDirective from './slider/plugin';
import switchDirective from './switch/plugin';
import watchDirective from './watch/plugin';
import viewportDirective from './viewport/plugin';
import alwaysOnTopDirective from './alwaysOnTop/plugin';
import { parseEditorDirectives } from './utils';

import buildDisplayModel from '../graphicHelper/buildDisplayModel';
import { parseBlockDirectives } from '../../utils/parseBlockDirectives';

import type { CodeBlockGraphicData, ParsedDirectiveRecord, State } from '~/types';
import type {
	DirectiveDeriveOptions,
	DirectiveDerivedState,
	DirectiveDerivedStateDraft,
	EditorDirectivePlugin,
	ParsedEditorDirective,
} from './types';

export type {
	ParsedEditorDirective,
	DirectiveLayoutContribution,
	DirectiveBlockState,
	DirectiveDerivedState,
	ViewportAnchor,
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
	favoriteDirective,
	hideDirective,
	opacityDirective,
	groupDirective,
	viewportDirective,
	alwaysOnTopDirective,
];

export function deriveDirectiveState(
	code: string[],
	parsedDirectives: ParsedDirectiveRecord[],
	options: DirectiveDeriveOptions = {},
	plugins: EditorDirectivePlugin[] = directivePlugins
): DirectiveDerivedState {
	const pluginEntries = plugins.flatMap(plugin =>
		[plugin.name, ...(plugin.aliases ?? [])].map(name => [name, plugin] as const)
	);
	const pluginsByName = new Map(pluginEntries);
	const directives: ParsedEditorDirective[] = parsedDirectives.flatMap(directive => {
		if (directive.prefix !== '@') {
			return [];
		}

		const plugin = pluginsByName.get(directive.name);
		if (!plugin) {
			return [];
		}

		return [
			{
				name: plugin.name,
				rawRow: directive.rawRow,
				args: directive.args,
				sourceLine: directive.sourceLine,
			},
		];
	});
	const draft: DirectiveDerivedStateDraft = {
		sourceCode: code,
		blockState: {
			disabled: false,
			isHome: false,
			isFavorite: false,
			opacity: 1,
		},
		displayState: {},
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
		displayState: draft.displayState,
		displayModel: buildDisplayModel(code, {
			...draft.displayState,
			isExpandedForEditing: options.isExpandedForEditing,
		}),
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
				{ name: 'plot', rawRow: 1, args: ['buffer', '-1', '1'], sourceLine: '; @plot buffer -1 1' },
				{ name: 'slider', rawRow: 2, args: ['gain', '0', '1', '0.01'], sourceLine: '; @slider gain 0 1 0.01' },
			]);
		});

		it('parses trailing-comment directives only for plugins that allow them', () => {
			const result = parseEditorDirectives(['int foo 1 ; @watch', 'int bar 1 ; @plot buffer'], directivePlugins);

			expect(result).toEqual([{ name: 'watch', rawRow: 0, args: [], sourceLine: 'int foo 1 ; @watch' }]);
		});

		it('normalizes plugin aliases during parsing', () => {
			const result = parseEditorDirectives(['; @w value'], directivePlugins);

			expect(result).toEqual([{ name: 'watch', rawRow: 0, args: ['value'], sourceLine: '; @w value' }]);
		});

		it('derives block state and layout in a single pass', () => {
			const code = [
				'module foo',
				'; @disabled',
				'; @home',
				'; @favorite',
				'; @plot buffer',
				'; @scan buffer pointer',
				'moduleEnd',
			];
			const result = deriveDirectiveState(code, parseBlockDirectives(code));

			expect(result.blockState).toEqual({
				disabled: true,
				isHome: true,
				isFavorite: true,
				opacity: 1,
			});
			expect(result.layoutContributions).toEqual([
				{ rawRow: 4, rows: 8 },
				{ rawRow: 5, rows: 2 },
			]);
			expect(result.displayState).toEqual({});
			expect(result.displayModel.displayRowToRawRow).toEqual([0, 1, 2, 3, 4, 5, 6]);
		});

		it('ignores unregistered directives', () => {
			const code = ['; @unknown', '; @home', '; @plot buffer'];
			const result = deriveDirectiveState(code, parseBlockDirectives(code));

			expect(result.blockState).toEqual({
				disabled: false,
				isHome: true,
				isFavorite: false,
				opacity: 1,
			});
			expect(result.layoutContributions).toEqual([{ rawRow: 2, rows: 8 }]);
		});

		it('collapses everything after @hide while unselected', () => {
			const code = ['module foo', '; @hide', 'push 1', 'moduleEnd'];
			const result = deriveDirectiveState(code, parseBlockDirectives(code));

			expect(result.displayState).toEqual({ hideAfterRawRow: 1 });
			expect(result.displayModel.displayRowToRawRow).toEqual([0, 1, 1]);
			expect(result.displayModel.lines[2]).toEqual({ rawRow: 1, text: '...', isPlaceholder: true });
			expect(result.displayModel.isCollapsed).toBe(true);
		});

		it('expands hidden code while editing', () => {
			const code = ['module foo', '; @hide', 'push 1', 'moduleEnd'];
			const result = deriveDirectiveState(code, parseBlockDirectives(code), {
				isExpandedForEditing: true,
			});

			expect(result.displayModel.displayRowToRawRow).toEqual([0, 1, 2, 3]);
			expect(result.displayModel.isCollapsed).toBe(false);
		});
	});
}
