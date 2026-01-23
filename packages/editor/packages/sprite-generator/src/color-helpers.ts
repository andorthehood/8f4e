/**
 * Color helper utilities for deriving custom color schemes
 * All functions accept hex (#rgb, #rrggbb) or rgba(r,g,b,a) format
 * All functions return rgba(r,g,b,a) format
 */

interface RGBA {
	r: number;
	g: number;
	b: number;
	a: number;
}

/**
 * Parse a color string (hex or rgba) into an RGBA object
 * @param color - Color string in format #rgb, #rrggbb, or rgba(r,g,b,a)
 * @returns RGBA object with values 0-255 for r,g,b and 0-1 for a
 */
function parseColor(color: string): RGBA {
	const trimmed = color.trim();

	// Handle hex format
	if (trimmed.startsWith('#')) {
		const hex = trimmed.slice(1);

		// Validate hex characters
		if (!/^[0-9a-fA-F]+$/.test(hex)) {
			throw new Error(`Invalid hex color format: ${color}`);
		}

		// 3-digit hex (#rgb)
		if (hex.length === 3) {
			const r = parseInt(hex[0] + hex[0], 16);
			const g = parseInt(hex[1] + hex[1], 16);
			const b = parseInt(hex[2] + hex[2], 16);
			return { r, g, b, a: 1 };
		}

		// 6-digit hex (#rrggbb)
		if (hex.length === 6) {
			const r = parseInt(hex.slice(0, 2), 16);
			const g = parseInt(hex.slice(2, 4), 16);
			const b = parseInt(hex.slice(4, 6), 16);
			return { r, g, b, a: 1 };
		}

		throw new Error(`Invalid hex color format: ${color}`);
	}

	// Handle rgba/rgb format
	// Supports both rgb(r,g,b) and rgba(r,g,b,a) formats for flexibility
	const rgbaMatch = trimmed.match(/^rgba?\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/);
	if (rgbaMatch) {
		const r = parseInt(rgbaMatch[1], 10);
		const g = parseInt(rgbaMatch[2], 10);
		const b = parseInt(rgbaMatch[3], 10);
		const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;

		// Validate RGB values are in the 0-255 range
		if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
			throw new Error(`Invalid color format: RGB values must be in the 0-255 range: ${color}`);
		}

		// Validate alpha is in the 0-1 range
		if (a < 0 || a > 1) {
			throw new Error(`Invalid color format: Alpha value must be in the 0-1 range: ${color}`);
		}

		return { r, g, b, a };
	}

	throw new Error(`Invalid color format: ${color}`);
}

/**
 * Convert RGBA object to rgba(r,g,b,a) string
 * @param rgba - RGBA object
 * @returns rgba string in format rgba(r,g,b,a)
 */
function toRgbaString(rgba: RGBA): string {
	// Clamp RGB values to 0-255 range and alpha to 0-1 range
	const r = clamp(Math.round(rgba.r), 0, 255);
	const g = clamp(Math.round(rgba.g), 0, 255);
	const b = clamp(Math.round(rgba.b), 0, 255);
	const a = clamp(rgba.a, 0, 1);

	return `rgba(${r},${g},${b},${a})`;
}

/**
 * Clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Lighten a color by a percentage
 * @param color - Color string in hex or rgba format
 * @param amount - Amount to lighten (0-1), where 0 is no change and 1 is white
 * @returns rgba string in format rgba(r,g,b,a)
 */
export function lighten(color: string, amount: number): string {
	const rgba = parseColor(color);
	const clampedAmount = clamp(amount, 0, 1);

	return toRgbaString({
		r: rgba.r + (255 - rgba.r) * clampedAmount,
		g: rgba.g + (255 - rgba.g) * clampedAmount,
		b: rgba.b + (255 - rgba.b) * clampedAmount,
		a: rgba.a,
	});
}

/**
 * Darken a color by a percentage
 * @param color - Color string in hex or rgba format
 * @param amount - Amount to darken (0-1), where 0 is no change and 1 is black
 * @returns rgba string in format rgba(r,g,b,a)
 */
export function darken(color: string, amount: number): string {
	const rgba = parseColor(color);
	const clampedAmount = clamp(amount, 0, 1);

	return toRgbaString({
		r: rgba.r * (1 - clampedAmount),
		g: rgba.g * (1 - clampedAmount),
		b: rgba.b * (1 - clampedAmount),
		a: rgba.a,
	});
}

/**
 * Set the alpha channel of a color
 * @param color - Color string in hex or rgba format
 * @param alphaValue - Alpha value (0-1), where 0 is fully transparent and 1 is fully opaque
 * @returns rgba string in format rgba(r,g,b,a)
 */
export function alpha(color: string, alphaValue: number): string {
	const rgba = parseColor(color);
	const clampedAlpha = clamp(alphaValue, 0, 1);

	return toRgbaString({
		r: rgba.r,
		g: rgba.g,
		b: rgba.b,
		a: clampedAlpha,
	});
}

/**
 * Mix two colors together
 * @param color1 - First color string in hex or rgba format
 * @param color2 - Second color string in hex or rgba format
 * @param weight - Weight of the first color (0-1), where 0 is all color2 and 1 is all color1
 * @returns rgba string in format rgba(r,g,b,a)
 */
export function mix(color1: string, color2: string, weight: number = 0.5): string {
	const rgba1 = parseColor(color1);
	const rgba2 = parseColor(color2);
	const clampedWeight = clamp(weight, 0, 1);

	return toRgbaString({
		r: rgba1.r * clampedWeight + rgba2.r * (1 - clampedWeight),
		g: rgba1.g * clampedWeight + rgba2.g * (1 - clampedWeight),
		b: rgba1.b * clampedWeight + rgba2.b * (1 - clampedWeight),
		a: rgba1.a * clampedWeight + rgba2.a * (1 - clampedWeight),
	});
}
