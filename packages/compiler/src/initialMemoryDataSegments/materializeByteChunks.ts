export type ByteChunk = Uint8Array | number;

export default function materializeByteChunks(chunks: ByteChunk[], byteLength: number): Uint8Array {
	const bytes = new Uint8Array(byteLength);
	let byteOffset = 0;

	for (const chunk of chunks) {
		if (typeof chunk === 'number') {
			byteOffset += chunk;
			continue;
		}

		bytes.set(chunk, byteOffset);
		byteOffset += chunk.length;
	}

	return bytes;
}
