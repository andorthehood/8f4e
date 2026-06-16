import type { State } from '@8f4e/editor-state-types';
import type { Engine, Rgba8Texture, Rgba8TextureFilter } from 'glugglug';
import type { MemoryViews } from '../types';

export type WasmFrameTextureObjectFit = 'fill' | 'cover' | 'contain' | 'none';
export type WasmFrameTextureSize = number | string;

export interface WasmFrameTextureOptions {
	entry: string;
	target: string;
	width: number;
	height: number;
	size?: WasmFrameTextureSize;
	filter?: Rgba8TextureFilter;
	objectFit?: WasmFrameTextureObjectFit;
}

export interface WasmFrameTextureDrawerOptions {
	state: State;
	memoryViews: MemoryViews;
	frameTexture: WasmFrameTextureOptions;
	getCodeBuffer: () => Uint8Array;
	getMemory: () => WebAssembly.Memory | null;
	getViewportSize: () => { width: number; height: number };
	instantiate?: (
		memory: WebAssembly.Memory,
		codeBuffer: Uint8Array
	) => Promise<WebAssembly.Exports> | WebAssembly.Exports;
}

async function instantiateWasmFrameTexture(
	memory: WebAssembly.Memory,
	codeBuffer: Uint8Array
): Promise<WebAssembly.Exports> {
	const { instance } = (await WebAssembly.instantiate(codeBuffer, {
		host: {
			memory,
		},
	})) as unknown as WebAssembly.WebAssemblyInstantiatedSource;

	return instance.exports;
}

function normalizePositiveInteger(value: number): number {
	return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

function getFrameBufferByteAddress(state: State, target: string): number | undefined {
	const [moduleId, memoryId] = target.split(':');
	if (!moduleId || !memoryId) {
		return undefined;
	}

	const memory = state.compiler.compiledModules[moduleId]?.memory[memoryId];
	return typeof memory?.byteAddress === 'number' ? memory.byteAddress : undefined;
}

function resolveSize(value: WasmFrameTextureSize | undefined, sourceWidth: number): number | undefined {
	if (typeof value === 'number') {
		return Number.isFinite(value) && value > 0 ? value : undefined;
	}

	const match = typeof value === 'string' ? value.trim().match(/^(\d+(?:\.\d+)?)%$/) : undefined;
	if (!match) {
		return undefined;
	}

	const percentage = Number(match[1]);
	return Number.isFinite(percentage) && percentage > 0 ? (sourceWidth * percentage) / 100 : undefined;
}

function centerDrawRect(
	width: number,
	height: number,
	viewportWidth: number,
	viewportHeight: number
): { x: number; y: number; width: number; height: number } {
	return {
		x: (viewportWidth - width) / 2,
		y: (viewportHeight - height) / 2,
		width,
		height,
	};
}

export function getObjectFitDrawRect(
	objectFit: WasmFrameTextureObjectFit,
	sourceWidth: number,
	sourceHeight: number,
	viewportWidth: number,
	viewportHeight: number,
	size?: WasmFrameTextureSize
): { x: number; y: number; width: number; height: number } {
	const resolvedSize = resolveSize(size, sourceWidth);
	if (resolvedSize) {
		const width = resolvedSize;
		const height = (resolvedSize * sourceHeight) / sourceWidth;
		return centerDrawRect(width, height, viewportWidth, viewportHeight);
	}

	if (objectFit === 'fill') {
		return { x: 0, y: 0, width: viewportWidth, height: viewportHeight };
	}

	if (objectFit === 'none') {
		return centerDrawRect(sourceWidth, sourceHeight, viewportWidth, viewportHeight);
	}

	const scale =
		objectFit === 'cover'
			? Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight)
			: Math.min(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
	const width = sourceWidth * scale;
	const height = sourceHeight * scale;

	return centerDrawRect(width, height, viewportWidth, viewportHeight);
}

export function createWasmFrameTextureDrawer({
	state,
	memoryViews,
	frameTexture,
	getCodeBuffer,
	getMemory,
	getViewportSize,
	instantiate = instantiateWasmFrameTexture,
}: WasmFrameTextureDrawerOptions): (engine: Engine) => void {
	const sourceWidth = normalizePositiveInteger(frameTexture.width);
	const sourceHeight = normalizePositiveInteger(frameTexture.height);
	const byteLength = sourceWidth * sourceHeight * 4;
	const filter = frameTexture.filter ?? 'nearest';
	const objectFit = frameTexture.objectFit ?? 'fill';
	let texture: Rgba8Texture | undefined;
	let cachedMemory: WebAssembly.Memory | null = null;
	let cachedCodeBuffer: Uint8Array | undefined;
	let cachedExports: WebAssembly.Exports | undefined;
	let pendingMemory: WebAssembly.Memory | null = null;
	let pendingCodeBuffer: Uint8Array | undefined;
	let pendingExports: Promise<WebAssembly.Exports | undefined> | undefined;
	let generation = 0;

	function clearWasmInstance(): void {
		cachedMemory = null;
		cachedCodeBuffer = undefined;
		cachedExports = undefined;
		pendingMemory = null;
		pendingCodeBuffer = undefined;
		pendingExports = undefined;
		generation++;
	}

	function syncWasmInstance(): WebAssembly.Exports | undefined {
		const memory = getMemory();
		const codeBuffer = getCodeBuffer();

		if (!memory || codeBuffer.length === 0) {
			clearWasmInstance();
			return undefined;
		}

		if (cachedExports && cachedMemory === memory && cachedCodeBuffer === codeBuffer) {
			return cachedExports;
		}

		if (pendingExports && pendingMemory === memory && pendingCodeBuffer === codeBuffer) {
			return undefined;
		}

		const instantiateGeneration = generation;
		pendingMemory = memory;
		pendingCodeBuffer = codeBuffer;
		const instantiatePromise = Promise.resolve(instantiate(memory, codeBuffer))
			.then(exports => {
				if (generation !== instantiateGeneration || pendingExports !== instantiatePromise) {
					return undefined;
				}

				cachedMemory = memory;
				cachedCodeBuffer = codeBuffer;
				cachedExports = exports;
				pendingMemory = null;
				pendingCodeBuffer = undefined;
				pendingExports = undefined;

				return exports;
			})
			.catch(error => {
				if (pendingExports === instantiatePromise) {
					pendingMemory = null;
					pendingCodeBuffer = undefined;
					pendingExports = undefined;
				}

				console.error('Failed to instantiate frame texture WebAssembly module:', error);
				return undefined;
			});
		pendingExports = instantiatePromise;

		return undefined;
	}

	return engine => {
		const exports = syncWasmInstance();
		if (!exports) {
			return;
		}

		const entry = exports[frameTexture.entry];
		if (typeof entry !== 'function') {
			return;
		}

		entry();

		const byteAddress = getFrameBufferByteAddress(state, frameTexture.target);
		if (byteAddress === undefined || byteAddress + byteLength > memoryViews.uint8.byteLength) {
			return;
		}

		const data = memoryViews.uint8.subarray(byteAddress, byteAddress + byteLength);
		texture = engine.uploadRgba8Texture(data, sourceWidth, sourceHeight, {
			texture,
			filter,
		});
		const viewport = getViewportSize();
		const drawRect = getObjectFitDrawRect(
			objectFit,
			sourceWidth,
			sourceHeight,
			viewport.width,
			viewport.height,
			frameTexture.size
		);
		engine.drawTexture(texture, drawRect.x, drawRect.y, drawRect.width, drawRect.height);
	};
}
