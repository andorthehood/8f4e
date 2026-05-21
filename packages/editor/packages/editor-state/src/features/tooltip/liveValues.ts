import { BASE_TYPE_METADATA, type DataStructure } from '@8f4e/compiler-spec';

import { maxLiveMemoryAddressLength, maxLiveMemoryValueLength } from './constants';
import { getTooltipLineColors } from './colors';

import type { TooltipLiveValueSource } from '@8f4e/editor-state-types';
import type { SpriteLookup } from 'glugglug';
import type { SpriteLookups, TooltipLiveValueTarget } from './types';

interface LiveTooltipLine {
	label: string;
	maxLineLength: number;
	source: TooltipLiveValueSource;
}

export interface LiveTooltipContent {
	text: string[];
	colors: Array<Array<SpriteLookup | undefined>>;
	liveValueTargets: TooltipLiveValueTarget[];
	maxLineLength: number;
}

/**
 * Returns true when memory tooltip content should include a dereferenced value.
 */
function isPointerMemory(memory: DataStructure): boolean {
	return Boolean(memory.pointeeBaseType || memory.isPointingToPointer);
}

/**
 * Describes how the drawer should read a pointer's dereferenced live value.
 */
function getDereferencedMemoryFormat(memory: DataStructure) {
	const pointeeType = memory.isPointingToPointer ? 'pointer' : memory.pointeeBaseType!;
	const metadata = BASE_TYPE_METADATA[pointeeType];

	return {
		elementWordSize: metadata.wordSize,
		isInteger: metadata.isInteger,
		isUnsigned: pointeeType === 'int8u' || pointeeType === 'int16u',
	};
}

/**
 * Builds tooltip rows and live-value targets for selected memory declarations.
 */
export function getLiveTooltipContent(
	memory: DataStructure | undefined,
	moduleId: string | undefined,
	memoryId: string | undefined,
	firstLineIndex: number,
	spriteLookups: SpriteLookups | undefined
): LiveTooltipContent {
	if (!memory || !moduleId || !memoryId) {
		return { text: [], colors: [], liveValueTargets: [], maxLineLength: 0 };
	}

	const valueColor = spriteLookups?.fontTooltipHighlight;
	const valueLabel = memory.numberOfElements > 1 ? 'value[0]: ' : 'value: ';
	const lines: LiveTooltipLine[] = [
		{
			label: 'address: ',
			maxLineLength: 'address: '.length + maxLiveMemoryAddressLength,
			source: { kind: 'memoryAddress', moduleId, memoryId },
		},
		{
			label: valueLabel,
			maxLineLength: valueLabel.length + maxLiveMemoryValueLength,
			source: { kind: 'memoryValue', moduleId, memoryId, elementIndex: 0 },
		},
	];

	if (isPointerMemory(memory)) {
		lines.push({
			label: 'deref: ',
			maxLineLength: 'deref: '.length + maxLiveMemoryValueLength,
			source: { kind: 'memoryDereference', moduleId, memoryId, format: getDereferencedMemoryFormat(memory) },
		});
	}

	return {
		text: lines.map(liveLine => liveLine.label),
		colors: lines.map(liveLine => getTooltipLineColors(liveLine.label, spriteLookups)),
		liveValueTargets: lines.map((liveLine, index) => ({
			lineIndex: firstLineIndex + index,
			column: liveLine.label.length,
			source: liveLine.source,
			color: valueColor,
		})),
		maxLineLength: Math.max(...lines.map(line => line.maxLineLength)),
	};
}
