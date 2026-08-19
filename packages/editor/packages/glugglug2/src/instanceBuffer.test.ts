import { describe, expect, it } from 'vitest';

import { INSTANCE_BYTE_STRIDE, InstanceBuffer } from './instanceBuffer.ts';

describe('InstanceBuffer', () => {
	it('packs rectangles and sprite ids into 20-byte records', () => {
		const instances = new InstanceBuffer(2);
		instances.append(10, 20, 30, 40, 7);
		instances.append(-5, 2.5, 12, 14, 9);

		const bytes = instances.usedBytes();
		const floats = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
		const integers = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);

		expect(instances.count).toBe(2);
		expect(bytes.byteLength).toBe(2 * INSTANCE_BYTE_STRIDE);
		expect(Array.from(floats.slice(0, 4))).toEqual([10, 20, 30, 40]);
		expect(integers[4]).toBe(7);
		expect(Array.from(floats.slice(5, 9))).toEqual([-5, 2.5, 12, 14]);
		expect(integers[9]).toBe(9);
	});

	it('grows geometrically while preserving instances already appended this frame', () => {
		const instances = new InstanceBuffer(1);
		instances.append(1, 2, 3, 4, 5);
		instances.append(6, 7, 8, 9, 10);

		expect(instances.capacity).toBe(2);
		const floats = new Float32Array(instances.usedBytes().buffer);
		expect(Array.from(floats.slice(0, 4))).toEqual([1, 2, 3, 4]);
		expect(Array.from(floats.slice(5, 9))).toEqual([6, 7, 8, 9]);
	});

	it('resets only the write cursor and reuses the allocation', () => {
		const instances = new InstanceBuffer(2);
		instances.append(1, 2, 3, 4, 5);
		const storage = instances.usedBytes().buffer;

		instances.reset();
		instances.append(10, 20, 30, 40, 50);

		expect(instances.count).toBe(1);
		expect(instances.usedBytes().buffer).toBe(storage);
		const floats = new Float32Array(storage);
		expect(Array.from(floats.slice(0, 4))).toEqual([10, 20, 30, 40]);
	});

	it('rejects invalid initial capacities', () => {
		expect(() => new InstanceBuffer(0)).toThrow('initialCapacity must be a positive integer');
		expect(() => new InstanceBuffer(1.5)).toThrow('initialCapacity must be a positive integer');
	});
});
