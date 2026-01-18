/**
 * Types for binary-assets feature - binary file loading and management.
 */

/**
 * Binary asset configuration for project storage.
 */
export interface BinaryAsset {
	/** The id of the module that the binary data should be loaded into */
	moduleId?: string;
	/** The id of the memory that the binary data should be loaded into */
	memoryId?: string;
	/** The file name of the binary data */
	fileName: string;
	/** Non-cryptographic hash for versioning */
	contentHash?: string;
	/** Web, data or relative file URL */
	url?: string;
	/** MIME type of the binary data */
	mimeType?: string;
	/** Size of the binary data in bytes */
	sizeBytes?: number;
}

/**
 * Resolved binary asset with runtime memory location.
 */
export interface ResolvedBinaryAsset {
	url: string;
	moduleId: string;
	memoryName: string;
	byteAddress: number;
	byteLength: number;
}
