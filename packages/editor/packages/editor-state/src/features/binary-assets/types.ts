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
	/** Whether the asset is currently being loaded into memory (runtime only, not persisted) */
	isLoading?: boolean;
	/** Whether the asset has been loaded into WASM memory (runtime only, not persisted) */
	loadedIntoMemory?: boolean;
}

/**
 * Binary asset metadata stored in editor-state.
 * Tracks fetch and load status for progress UI.
 * URL serves as the asset identifier - the same URL may be loaded into multiple memory targets.
 */
export interface BinaryAssetMeta {
	/** URL serves as the unique identifier for the asset */
	url: string;
	/** File name extracted from URL */
	fileName: string;
	/** MIME type of the binary data */
	mimeType?: string;
	/** Size of the binary data in bytes */
	sizeBytes: number;
	/** Whether the asset is currently being loaded into memory */
	isLoading: boolean;
	/** Whether the asset has been loaded into WASM memory */
	loadedIntoMemory: boolean;
}

/**
 * Resolved binary asset with runtime memory location.
 * Used by the legacy loadBinaryFileIntoMemory callback.
 */
export interface ResolvedBinaryAsset {
	url: string;
	moduleId: string;
	memoryName: string;
	byteAddress: number;
	byteLength: number;
}

/**
 * Memory target location for binary asset loading.
 * Used by the new loadBinaryAssetIntoMemory callback (url passed separately).
 */
export interface BinaryAssetTarget {
	moduleId: string;
	memoryName: string;
	byteAddress: number;
	byteLength: number;
}
