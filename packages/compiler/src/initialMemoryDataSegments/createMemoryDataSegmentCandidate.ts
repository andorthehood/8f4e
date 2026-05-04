import materializeByteChunks from './materializeByteChunks';
import writeDefaultValue from './writeDefaultValue';

import type { InitialMemoryDataSegmentCandidate } from './types';
import type { DataStructure } from '@8f4e/compiler-types';

export default function createMemoryDataSegmentCandidate(memory: DataStructure): InitialMemoryDataSegmentCandidate[] {
	const isArray = memory.numberOfElements > 1;
	if (isArray && memory.hasExplicitDefault !== true) {
		return [];
	}
	if (!isArray && memory.hasExplicitDefault !== true && memory.default === 0) {
		return [];
	}

	if (isArray) {
		return createArrayDataSegmentCandidates(memory);
	}

	const bytes = createDefaultValueBytes(memory, memory.default as number);
	return [
		{
			byteAddress: memory.byteAddress,
			bytes,
			sourceKind: 'scalar',
		},
	];
}

function createArrayDataSegmentCandidates(memory: DataStructure): InitialMemoryDataSegmentCandidate[] {
	const segments: InitialMemoryDataSegmentCandidate[] = [];
	let runByteAddress = 0;
	let runByteLength = 0;
	let runChunks: Uint8Array[] = [];
	let nextRunByteAddress: number | undefined;

	const flushRun = () => {
		if (runChunks.length === 0) {
			return;
		}

		segments.push({
			byteAddress: runByteAddress,
			bytes: materializeByteChunks(runChunks, runByteLength),
			sourceKind: 'array',
		});
		runByteLength = 0;
		runChunks = [];
		nextRunByteAddress = undefined;
	};

	for (const { elementIndex, value } of Object.entries(memory.default as Record<string, number>)
		.map(([elementIndex, value]) => ({
			elementIndex: parseInt(elementIndex, 10),
			value,
		}))
		.sort((left, right) => left.elementIndex - right.elementIndex)) {
		const bytes = createDefaultValueBytes(memory, value);
		if (bytes.every(byte => byte === 0)) {
			flushRun();
			continue;
		}

		const byteAddress = memory.byteAddress + elementIndex * memory.elementWordSize;
		if (nextRunByteAddress !== byteAddress) {
			flushRun();
			runByteAddress = byteAddress;
		}

		runChunks.push(bytes);
		runByteLength += bytes.length;
		nextRunByteAddress = byteAddress + bytes.length;
	}

	flushRun();

	return segments;
}

function createDefaultValueBytes(memory: DataStructure, value: number): Uint8Array {
	const bytes = new Uint8Array(memory.elementWordSize);
	const view = new DataView(bytes.buffer);
	writeDefaultValue(view, memory, 0, value);

	return bytes;
}
