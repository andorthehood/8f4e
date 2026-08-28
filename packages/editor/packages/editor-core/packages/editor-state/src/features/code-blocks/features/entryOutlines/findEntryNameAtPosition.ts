import type { CodeBlockEntryOutline } from '@8f4e/editor-state-types';

export default function findEntryNameAtPosition(
	entryOutlines: CodeBlockEntryOutline[],
	x: number,
	y: number
): string | undefined {
	return entryOutlines.find(
		outline => x >= outline.topLeft.x && x <= outline.topRight.x && y >= outline.topLeft.y && y <= outline.bottomLeft.y
	)?.entryName;
}
