import type { SpriteIdLookup, SpriteIdLookups } from '@8f4e/sprite-generator';

export function generateColorMapWithAllColors(spriteLookups: SpriteIdLookups) {
	return [
		[spriteLookups.fontBinaryOne],
		[spriteLookups.fontBinaryZero],
		[spriteLookups.fontCode],
		[spriteLookups.fontCodeComment],
		[spriteLookups.fontInfoKey],
		[spriteLookups.fontInfoValue],
		[spriteLookups.fontErrorMessage],
		[spriteLookups.fontDialogText],
		[spriteLookups.fontDialogTitle],
		[spriteLookups.fontInstruction],
		[spriteLookups.fontLineNumber],
		[spriteLookups.fontMenuItemText],
		[spriteLookups.fontMenuItemTextHighlighted],
		[spriteLookups.fontNumbers],
		[spriteLookups.fontPianoKeyWhitePressedOverlay],
		[spriteLookups.fontPianoKeyBlackPressedOverlay],
	];
}

export function generateColorMapWithOneColor(color: SpriteIdLookup, lines: number) {
	return new Array(lines).fill([color]);
}
