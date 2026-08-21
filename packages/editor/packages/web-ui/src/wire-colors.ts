import { type ColorSchemeOverrides, resolveColorScheme } from '@8f4e/sprite-generator';
import type { LineColor } from 'glugglug';

/** Resolved RGBA colors used by the wire line drawer. */
export type WireColors = {
	wire: LineColor;
	wireHighlighted: LineColor;
};

type ColorContext = Pick<OffscreenCanvasRenderingContext2D, 'clearRect' | 'fillRect' | 'fillStyle' | 'getImageData'>;

/**
 * Creates the tiny canvas context used to turn CSS theme colors into RGBA components.
 *
 * @returns A 2D canvas context suitable for resolving CSS colors.
 */
function createColorContext(): ColorContext {
	const context = new OffscreenCanvas(1, 1).getContext('2d', { alpha: true });
	if (!context) {
		throw new Error('Could not create a canvas context for resolving wire colors.');
	}
	return context;
}

/**
 * Resolves the editor theme's wire colors into the normalized RGBA values expected by the line drawer.
 * This runs only when the theme-backed sprite atlas is loaded, never while sprites and lines are appended.
 *
 * @param overrides - Editor color-scheme overrides to merge with the default color scheme.
 * @param context - Optional canvas context used to resolve CSS colors, primarily for deterministic tests.
 * @returns Normalized regular and highlighted wire colors.
 */
export function resolveWireColors(
	overrides: ColorSchemeOverrides | Record<string, unknown> = {},
	context: ColorContext = createColorContext()
): WireColors {
	const fill = resolveColorScheme(overrides).fill;

	return {
		wire: resolveCssColor(fill.wire, context),
		wireHighlighted: resolveCssColor(fill.wireHighlighted, context),
	};
}

/**
 * Uses the browser's CSS color parser to convert a color string to normalized RGBA components.
 *
 * @param color - CSS color string to resolve.
 * @param context - Canvas context used for parsing and sampling the color.
 * @returns The color as normalized red, green, blue, and alpha components.
 */
function resolveCssColor(color: string, context: ColorContext): LineColor {
	context.clearRect(0, 0, 1, 1);
	context.fillStyle = color;
	context.fillRect(0, 0, 1, 1);
	const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
	return [red / 255, green / 255, blue / 255, alpha / 255];
}
