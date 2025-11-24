import { SpriteLookups } from '@8f4e/sprite-generator';
import { SpriteLookup } from 'glugglug';

export function generateColorMapWithAllColors(spriteLookups: SpriteLookups) {
	return [
		[spriteLookups.fontBinaryOne],
		[spriteLookups.fontBinaryZero],
		[spriteLookups.fontCode],
		[spriteLookups.fontCodeComment],
		[spriteLookups.fontDialogText],
		[spriteLookups.fontDialogTitle],
		[spriteLookups.fontInstruction],
		[spriteLookups.fontLineNumber],
		[spriteLookups.fontMenuItemText],
		[spriteLookups.fontMenuItemTextHighlighted],
		[spriteLookups.fontNumbers],
	];
}

export function generateColorMapWithOneColor(color: SpriteLookup, lines: number) {
	return new Array(lines).fill([color]);
}
