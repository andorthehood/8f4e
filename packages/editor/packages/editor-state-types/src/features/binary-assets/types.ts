/**
 * Types for binary asset metadata shared through editor state.
 */

/**
 * Binary asset metadata populated by the editor environment binary-assets plugin.
 * Editor-state stores this data for UI, export, and generated environment constants,
 * but does not fetch assets or write them into runtime memory.
 */
export interface BinaryAsset {
	/** Optional config-provided identifier for generated constants */
	id?: string;
	/** URL of the binary asset (serves as the asset identifier) */
	url: string;
	/** The file name of the binary data */
	fileName?: string;
	/** MIME type of the binary data */
	mimeType?: string;
	/** Size of the binary asset in bytes */
	assetByteLength?: number;
	/** Whether the asset has been loaded into WASM memory */
	loadedIntoMemory: boolean;
	/** Resolved runtime memory identifier in the form module:memory */
	memoryId?: string;
	/** Resolved byte address for the asset target */
	byteAddress?: number;
	/** Resolved byte length for the target memory segment */
	memoryByteLength?: number;
}
