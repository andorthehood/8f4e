import type { CodeBlockDisplayModel } from '../graphicHelper/buildDisplayModel';
import type { CodeBlockGraphicData, State } from '~/types';

export interface ParsedEditorDirective {
	name: string;
	rawRow: number;
	args: string[];
}

export interface DirectiveLayoutContribution {
	rawRow: number;
	rows: number;
}

export interface DirectiveBlockState {
	disabled: boolean;
	isHome: boolean;
	isFavorite: boolean;
	/** Group identifier set by `; @group <name> [nonstick]`. Undefined when no valid @group directive is present. */
	groupName?: string;
	/** When true the block may be dragged independently within its group (nonstick mode). */
	groupNonstick?: boolean;
}

export interface DirectiveDisplayState {
	hideAfterRawRow?: number;
}

export interface DirectiveWidgetContribution {
	beforeGraphicDataWidthCalculation?: (
		graphicData: CodeBlockGraphicData,
		state: State,
		directiveState: DirectiveDerivedState
	) => void;
	afterGraphicDataWidthCalculation?: (
		graphicData: CodeBlockGraphicData,
		state: State,
		directiveState: DirectiveDerivedState
	) => void;
}

export interface DirectiveDerivedState {
	blockState: DirectiveBlockState;
	displayState: DirectiveDisplayState;
	displayModel: CodeBlockDisplayModel;
	layoutContributions: DirectiveLayoutContribution[];
	widgets: DirectiveWidgetContribution[];
}

export interface DirectiveDerivedStateDraft extends DirectiveDerivedState {
	sourceCode: string[];
}

export interface DirectiveDeriveOptions {
	isExpandedForEditing?: boolean;
}

export interface EditorDirectivePlugin {
	name: string;
	clearGraphicData?: (graphicData: CodeBlockGraphicData) => void;
	apply?: (directive: ParsedEditorDirective, draft: DirectiveDerivedStateDraft) => void;
}
