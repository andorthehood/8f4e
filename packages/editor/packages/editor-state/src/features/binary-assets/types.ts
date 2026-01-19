/**
 * Types for binary-assets feature - binary file loading and management.
 */

/**
 * Binary asset metadata stored in editor-state.
 * Tracks fetch and load status independently.
 */
export interface BinaryAsset {
	/** URL of the binary asset (serves as the asset identifier) */
	url: string;
	/** The file name of the binary data */
	fileName?: string;
	/** MIME type of the binary data */
	mimeType?: string;
	/** Size of the binary data in bytes */
	sizeBytes?: number;
	/** Whether the asset has been loaded into WASM memory */
	loadedIntoMemory: boolean;
	/** Resolved runtime module identifier */
	moduleId?: string;
	/** Resolved runtime memory name */
	memoryName?: string;
	/** Resolved byte address for the asset target */
	byteAddress?: number;
	/** Resolved byte length for the asset target */
	byteLength?: number;
}
