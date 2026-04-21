import buttonDirective from './button/plugin';
import disabledDirective from './disabled/plugin';
import favoriteDirective from './favorite/plugin';
import groupDirective from './group/plugin';
import hideDirective from './hide/plugin';
import hiddenDirective from './hidden/plugin';
import homeDirective from './home/plugin';
import nthDirective from './nth/plugin';
import opacityDirective from './opacity/plugin';
import pianoDirective from './piano/plugin';
import meterDirective from './meter/plugin';
import barsDirective from './bars/plugin';
import plotDirective from './plot/plugin';
import waveDirective, { wave2Directive } from './wave/plugin';
import sliderDirective from './slider/plugin';
import switchDirective from './switch/plugin';
import watchDirective from './watch/plugin';
import viewportDirective from './viewport/plugin';
import alwaysOnTopDirective from './alwaysOnTop/plugin';
import { parseEditorDirectives, normalizeEditorDirectiveRecords } from './utils';

import buildDisplayModel from '../graphicHelper/buildDisplayModel';
import { parseBlockDirectives } from '../../utils/parseBlockDirectives';

import type { CodeBlockGraphicData, ParsedDirectiveRecord, State } from '~/types';
import type {
	DirectiveDeriveOptions,
	DirectiveDerivedState,
	DirectiveDerivedStateDraft,
	EditorDirectivePlugin,
} from './types';

export type {
	ParsedEditorDirective,
	DirectiveLayoutContribution,
	DirectiveBlockState,
	DirectiveDerivedState,
	ViewportAnchor,
} from './types';

export const directivePlugins: EditorDirectivePlugin[] = [
	meterDirective,
	barsDirective,
	plotDirective,
	waveDirective,
	wave2Directive,
	sliderDirective,
	pianoDirective,
	buttonDirective,
	switchDirective,
	watchDirective,
	nthDirective,
	disabledDirective,
	homeDirective,
	favoriteDirective,
	hideDirective,
	hiddenDirective,
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
	const directives = normalizeEditorDirectiveRecords(parsedDirectives, plugins);
	const draft: DirectiveDerivedStateDraft = {
		sourceCode: code,
		blockState: {
			disabled: false,
			hidden: false,
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
				[
					'module foo',
					'; @plot &buffer count(buffer)',
					'; @bars &bins count(bins)',
					'; @slider gain 0 1 0.01',
					'; note',
					'moduleEnd',
				],
				directivePlugins
			);

			expect(result).toEqual([
				{
					name: 'plot',
					rawRow: 1,
					args: ['&buffer', 'count(buffer)'],
					sourceLine: '; @plot &buffer count(buffer)',
				},
				{
					name: 'bars',
					rawRow: 2,
					args: ['&bins', 'count(bins)'],
					sourceLine: '; @bars &bins count(bins)',
				},
				{ name: 'slider', rawRow: 3, args: ['gain', '0', '1', '0.01'], sourceLine: '; @slider gain 0 1 0.01' },
			]);
		});

		it('parses trailing-comment directives only for plugins that allow them', () => {
			const result = parseEditorDirectives(
				['int foo 1 ; @watch', 'float out ; @meter', 'int bar 1 ; @plot buffer'],
				directivePlugins
			);

			expect(result).toEqual([
				{ name: 'watch', rawRow: 0, args: [], sourceLine: 'int foo 1 ; @watch' },
				{ name: 'meter', rawRow: 1, args: [], sourceLine: 'float out ; @meter' },
			]);
		});

		it('parses chained directives from a single full-line comment', () => {
			const result = parseEditorDirectives(['; @home @favorite'], directivePlugins);

			expect(result).toEqual([
				{ name: 'home', rawRow: 0, args: [], sourceLine: '; @home @favorite' },
				{ name: 'favorite', rawRow: 0, args: [], sourceLine: '; @home @favorite' },
			]);
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
				'; @meter level 0 1',
				'; @plot &buffer count(buffer)',
				'; @bars &bins count(bins)',
				'; @wave &buffer 16 pointer',
				'moduleEnd',
			];
			const result = deriveDirectiveState(code, parseBlockDirectives(code));

			expect(result.blockState).toEqual({
				disabled: true,
				hidden: false,
				isHome: true,
				isFavorite: true,
				opacity: 1,
			});
			expect(result.layoutContributions).toEqual([
				{ rawRow: 4, rows: 1 },
				{ rawRow: 5, rows: 8 },
				{ rawRow: 6, rows: 8 },
				{ rawRow: 7, rows: 2 },
			]);
			expect(result.displayState).toEqual({});
			expect(result.displayModel.displayRowToRawRow).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
		});

		it('allocates double layout height for @wave2', () => {
			const code = ['module foo', '; @wave2 &buffer 16 pointer', 'moduleEnd'];
			const result = deriveDirectiveState(code, parseBlockDirectives(code));

			expect(result.layoutContributions).toEqual([{ rawRow: 1, rows: 4 }]);
		});

		it('ignores unregistered directives', () => {
			const code = ['; @unknown', '; @home', '; @plot &buffer count(buffer)'];
			const result = deriveDirectiveState(code, parseBlockDirectives(code));

			expect(result.blockState).toEqual({
				disabled: false,
				hidden: false,
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

		it('derives hidden block state from @hidden', () => {
			const code = ['module foo', '; @hidden', 'moduleEnd'];
			const result = deriveDirectiveState(code, parseBlockDirectives(code));

			expect(result.blockState.hidden).toBe(true);
		});

		it('deriveDirectiveState and parseEditorDirectives agree on trailing directive behavior', () => {
			// @watch allows trailing comments; @plot does not.
			const code = ['int foo 1 ; @watch', 'int bar 1 ; @plot buffer'];
			const fromParse = parseEditorDirectives(code, directivePlugins);
			const fromDerive = deriveDirectiveState(code, parseBlockDirectives(code));

			// Both flows must recognize the trailing @watch (results in one parsed directive / one widget).
			expect(fromParse.map(d => d.name)).toEqual(['watch']);
			// @plot trailing should not produce any layout contribution.
			expect(fromDerive.layoutContributions).toEqual([]);
		});

		it('normalizes aliases in deriveDirectiveState the same way as parseEditorDirectives', () => {
			const code = ['; @w value'];
			const fromParse = parseEditorDirectives(code, directivePlugins);
			const fromDerive = deriveDirectiveState(code, parseBlockDirectives(code));

			// Both paths normalize '@w' to the canonical 'watch' name.
			expect(fromParse[0].name).toBe('watch');
			// @watch with a valid arg produces one widget.
			expect(fromDerive.widgets).toHaveLength(1);
		});
	});
}
