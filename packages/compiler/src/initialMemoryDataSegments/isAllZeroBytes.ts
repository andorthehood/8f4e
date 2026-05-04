export default function isAllZeroBytes(bytes: Uint8Array): boolean {
	return bytes.every(byte => byte === 0);
}
