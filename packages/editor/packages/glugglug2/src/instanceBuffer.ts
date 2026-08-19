export const INSTANCE_BYTE_STRIDE = 20;
const INSTANCE_WORD_STRIDE = INSTANCE_BYTE_STRIDE / Uint32Array.BYTES_PER_ELEMENT;

/**
 * Stores compact sprite instances in one reusable ArrayBuffer.
 *
 * Float and integer typed-array views share the same storage so each instance
 * occupies five 32-bit words: x, y, width, height, and sprite id.
 */
export class InstanceBuffer {
	private storage: ArrayBuffer;
	private floats: Float32Array;
	private integers: Uint32Array;
	private instanceCount = 0;

	/**
	 * Creates reusable storage for sprite instances.
	 *
	 * @param initialCapacity - Number of instances that fit before the first growth.
	 */
	constructor(initialCapacity: number) {
		assertPositiveInteger(initialCapacity, 'initialCapacity');
		this.storage = new ArrayBuffer(initialCapacity * INSTANCE_BYTE_STRIDE);
		this.floats = new Float32Array(this.storage);
		this.integers = new Uint32Array(this.storage);
	}

	/** @returns The number of instances that fit in the current allocation. */
	get capacity(): number {
		return this.storage.byteLength / INSTANCE_BYTE_STRIDE;
	}

	/** @returns The number of instances written during the current frame. */
	get count(): number {
		return this.instanceCount;
	}

	/** @returns The byte length occupied by instances written during the current frame. */
	get usedByteLength(): number {
		return this.instanceCount * INSTANCE_BYTE_STRIDE;
	}

	/** Resets the write cursor without clearing or reallocating the underlying storage. */
	reset(): void {
		this.instanceCount = 0;
	}

	/**
	 * Writes one sprite instance directly into the reusable storage at the current cursor.
	 *
	 * @param x - Destination X coordinate in canvas pixels.
	 * @param y - Destination Y coordinate in canvas pixels.
	 * @param width - Destination width in canvas pixels.
	 * @param height - Destination height in canvas pixels.
	 * @param spriteId - Dense numeric id used by the GPU atlas lookup.
	 */
	append(x: number, y: number, width: number, height: number, spriteId: number): void {
		this.ensureCapacity(this.instanceCount + 1);

		const offset = this.instanceCount * INSTANCE_WORD_STRIDE;
		this.floats[offset] = x;
		this.floats[offset + 1] = y;
		this.floats[offset + 2] = width;
		this.floats[offset + 3] = height;
		this.integers[offset + 4] = spriteId;
		this.instanceCount += 1;
	}

	/**
	 * Creates a zero-copy byte view over the portion written during the current frame.
	 *
	 * @returns A Uint8Array view suitable for one `bufferSubData()` upload.
	 */
	usedBytes(): Uint8Array {
		return new Uint8Array(this.storage, 0, this.usedByteLength);
	}

	/**
	 * Doubles storage until it can hold the requested number of instances.
	 *
	 * @param requiredCapacity - Minimum number of instances the allocation must hold.
	 */
	private ensureCapacity(requiredCapacity: number): void {
		if (requiredCapacity <= this.capacity) {
			return;
		}

		let nextCapacity = this.capacity;
		while (nextCapacity < requiredCapacity) {
			nextCapacity *= 2;
		}

		const nextStorage = new ArrayBuffer(nextCapacity * INSTANCE_BYTE_STRIDE);
		new Uint8Array(nextStorage).set(new Uint8Array(this.storage, 0, this.usedByteLength));
		this.storage = nextStorage;
		this.floats = new Float32Array(nextStorage);
		this.integers = new Uint32Array(nextStorage);
	}
}

/**
 * Rejects non-positive or fractional capacity values on the cold allocation path.
 *
 * @param value - Value to validate.
 * @param name - Parameter name included in the error message.
 */
function assertPositiveInteger(value: number, name: string): void {
	if (!Number.isInteger(value) || value <= 0) {
		throw new RangeError(`${name} must be a positive integer.`);
	}
}
