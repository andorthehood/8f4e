import type {
	CodeBlockGraphicData,
	DirectiveDerivedState,
	DirectiveDerivedStateDraft,
	DirectiveDeriveOptions,
	EditorDirectivePlugin,
	ParsedDirectiveRecord,
	State,
} from '@8f4e/editor-state-types';
import buildDisplayModel from '../graphicHelper/buildDisplayModel';
import alwaysOnTopDirective from './alwaysOnTop/plugin';
import barsDirective from './bars/plugin';
import buttonDirective from './button/plugin';
import crossfadeDirective from './crossfade/plugin';
import disabledDirective from './disabled/plugin';
import favoriteDirective from './favorite/plugin';
import groupDirective from './group/plugin';
import hiddenDirective from './hidden/plugin';
import hideDirective from './hide/plugin';
import homeDirective from './home/plugin';
import infoDirective from './info/plugin';
import meterDirective from './meter/plugin';
import opacityDirective from './opacity/plugin';
import pianoDirective from './piano/plugin';
import plotDirective from './plot/plugin';
import sliderDirective from './slider/plugin';
import switchDirective from './switch/plugin';
import { normalizeEditorDirectiveRecords } from './utils';
import viewportDirective from './viewport/plugin';
import watchDirective from './watch/plugin';
import waveDirective, { wave2Directive } from './wave/plugin';

export type {
	DirectiveBlockState,
	DirectiveDerivedState,
	DirectiveLayoutContribution,
	ParsedEditorDirective,
	ViewportAnchor,
} from '@8f4e/editor-state-types';

export const directivePlugins: EditorDirectivePlugin[] = [
	meterDirective,
	barsDirective,
	plotDirective,
	waveDirective,
	wave2Directive,
	sliderDirective,
	crossfadeDirective,
	pianoDirective,
	buttonDirective,
	switchDirective,
	watchDirective,
	infoDirective,
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
		state: options.state,
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
