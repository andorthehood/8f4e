import createVector from '../encoding/createVector';
import unsignedLEB128 from '../encoding/unsignedLEB128';
import { Section } from '../section';

import type { DataSegment } from '../section';

/**
 * Creates a WebAssembly data section containing passive or active data segments.
 */
export default function createDataSection(dataSegments: DataSegment[]): number[] {
	return [Section.DATA, ...createVector([...unsignedLEB128(dataSegments.length), ...dataSegments.flat()])];
}
