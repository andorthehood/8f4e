import generateSprite from '@8f4e/sprite-generator';
import { Engine, PostProcessEffect } from '@8f4e/2d-engine';

import { drawArrows, drawCodeBlocks, drawConnections, drawContextMenu, drawDialog, drawInfoOverlay } from './drawers';
import drawBackground from './drawers/drawBackground';

import type { ColorScheme } from '@8f4e/sprite-generator';
import type { State } from '../state/types';

// Cache for loaded color schemes
let colorSchemesCache: Record<string, ColorScheme> | null = null;

// Default fallback color scheme
const defaultColorScheme: ColorScheme = {
	text: {
		lineNumber: 'rgba(51,51,51,255)',
		instruction: 'rgba(136,126,203,255)',
		codeComment: 'rgba(102,102,102,255)',
		code: 'rgba(255,255,255,255)',
		numbers: 'rgba(201,212,135,255)',
		menuItemText: 'rgba(255,255,255,255)',
		menuItemTextHighlighted: 'rgba(0,0,0,255)',
		dialogText: '#ffffff',
		dialogTitle: '#ffffff',
		binaryZero: 'rgba(201,212,135,255)',
		binaryOne: 'rgba(201,212,135,255)',
	},
	fill: {
		menuItemBackground: 'rgba(0,0,0,255)',
		menuItemBackgroundHighlighted: 'rgba(255,255,255,255)',
		background: '#000000',
		backgroundDots: '#444444',
		backgroundDots2: '#444444',
		moduleBackground: '#000000',
		moduleBackgroundDragged: 'rgba(0,0,0,0.8)',
		wire: '#ffffff',
		wireHighlighted: '#ffffff',
		errorMessageBackground: '#cc0000',
		dialogBackground: '#000000',
		dialogDimmer: 'rgba(0,0,0,0.5)',
		highlightedCodeLine: '#333333',
		plotterBackground: '#001100',
		plotterTrace: '#66ff66',
	},
	icons: {
		outputConnectorBackground: '#003300',
		inputConnectorBackground: '#003300',
		switchBackground: '#003300',
		inputConnector: '#ffffff',
		outputConnector: '#ffffff',
		feedbackScale: ['#ff0000', '#cc0033', '#990066', '#660099', '#3300cc', '#0000ff'],
		arrow: '#ffffff',
		pianoKeyWhite: '#ffffff',
		pianoKeyWhiteHighlighted: '#ff0000',
		pianoKeyWhitePressed: '#cccccc',
		pianoKeyBlack: '#000000',
		pianoKeyBlackHighlighted: '#ff0000',
		pianoKeyBlackPressed: '#333333',
		pianoKeyboardBackground: '#999999',
		pianoKeyboardNote: '#ffffff',
		pianoKeyboardNoteHighlighted: '#ff0000',
	},
};

// Helper function to load color schemes with caching
async function loadColorSchemes(state: State): Promise<Record<string, ColorScheme>> {
	if (colorSchemesCache) {
		return colorSchemesCache;
	}

	try {
		if (state.options.loadColorSchemes) {
			colorSchemesCache = await state.options.loadColorSchemes();
		} else {
			// Fallback: return just the default scheme if no loader is provided
			colorSchemesCache = { default: defaultColorScheme };
		}
		return colorSchemesCache;
	} catch (error) {
		console.warn('Failed to load color schemes, using default:', error);
		colorSchemesCache = { default: defaultColorScheme };
		return colorSchemesCache;
	}
}

// Helper function to get a color scheme from cache with fallback
function getColorScheme(colorSchemes: Record<string, ColorScheme>, schemeName: string): ColorScheme {
	return colorSchemes[schemeName] || colorSchemes['default'] || defaultColorScheme;
}

export default async function init(
	state: State,
	canvas: HTMLCanvasElement
): Promise<{
	resize: (width: number, height: number) => void;
	reloadSpriteSheet: () => void;
	loadPostProcessEffects: (postProcessEffects: PostProcessEffect[]) => void;
}> {
	// Load color schemes during initialization
	const colorSchemes = await loadColorSchemes(state);

	const {
		canvas: sprite,
		spriteLookups,
		characterWidth,
		characterHeight,
	} = generateSprite({
		font: state.editorSettings.font || '8x16',
		colorScheme: getColorScheme(colorSchemes, state.editorSettings.colorScheme),
	});

	state.graphicHelper.spriteLookups = spriteLookups;
	state.graphicHelper.globalViewport.hGrid = characterHeight;
	state.graphicHelper.globalViewport.vGrid = characterWidth;

	const engine = new Engine(canvas, { caching: true });

	engine.loadSpriteSheet(sprite);

	engine.render(function (timeToRender, fps, vertices, maxVertices) {
		drawBackground(engine, state);
		drawCodeBlocks(engine, state);
		drawConnections(engine, state);
		if (state.featureFlags.infoOverlay) {
			drawInfoOverlay(engine, state, {
				timeToRender,
				fps,
				vertices,
				maxVertices,
			});
		}
		drawDialog(engine, state);
		drawArrows(engine, state);
		drawContextMenu(engine, state);
	});

	return {
		resize: (width, height) => {
			engine.resize(width, height);
		},
		reloadSpriteSheet: () => {
			// Use cached color schemes for synchronous reload
			const schemes = colorSchemesCache || { default: defaultColorScheme };

			const {
				canvas: sprite,
				spriteLookups,
				characterHeight,
				characterWidth,
			} = generateSprite({
				font: state.editorSettings.font || '8x16',
				colorScheme: getColorScheme(schemes, state.editorSettings.colorScheme),
			});

			state.graphicHelper.spriteLookups = spriteLookups;
			state.graphicHelper.globalViewport.hGrid = characterHeight;
			state.graphicHelper.globalViewport.vGrid = characterWidth;

			engine.loadSpriteSheet(sprite);
		},
		loadPostProcessEffects: (projectEffects: PostProcessEffect[] = []) => {
			engine.removeAllPostProcessEffects();

			for (const effect of projectEffects) {
				engine.addPostProcessEffect(effect);
			}
		},
	};
}
