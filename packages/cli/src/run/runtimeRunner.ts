import { createMemoryLookup } from './memoryLookup';

import type { DataStructure } from '@8f4e/compiler-spec';
import type { CreateRuntimeRunnerOptions, RuntimeRunner, MemoryLookup } from './types';

type WebAssemblyMemoryLike = {
	buffer: ArrayBufferLike;
};

type WebAssemblyInstanceLike = {
	exports: Record<string, unknown>;
};

type WebAssemblyApiLike = {
	Memory: new (descriptor: { initial: number; maximum: number; shared: boolean }) => WebAssemblyMemoryLike;
	instantiate: (
		bytes: Buffer,
		imports: { js: Record<string, WebAssemblyMemoryLike> & { memory: WebAssemblyMemoryLike } }
	) => Promise<{ instance: WebAssemblyInstanceLike }>;
};

function getWebAssemblyApi(): WebAssemblyApiLike {
	return (globalThis as unknown as { WebAssembly: WebAssemblyApiLike }).WebAssembly;
}

function readScalar(view: DataView, data: DataStructure): number {
	if (data.isInteger) {
		if (data.elementWordSize === 1) {
			return view.getInt8(data.byteAddress);
		}
		if (data.elementWordSize === 2) {
			return view.getInt16(data.byteAddress, true);
		}
		if (data.elementWordSize === 4) {
			return view.getInt32(data.byteAddress, true);
		}
		throw new Error(`Unsupported integer element size for ${data.id}: ${data.elementWordSize}`);
	}

	if (data.elementWordSize === 8 || data.isFloat64) {
		return view.getFloat64(data.byteAddress, true);
	}

	return view.getFloat32(data.byteAddress, true);
}

function writeScalar(view: DataView, data: DataStructure, value: number): void {
	if (data.isInteger) {
		if (!Number.isInteger(value)) {
			throw new Error(`Expected integer value for ${data.id}, got ${value}`);
		}

		if (data.elementWordSize === 1) {
			view.setInt8(data.byteAddress, value);
			return;
		}
		if (data.elementWordSize === 2) {
			view.setInt16(data.byteAddress, value, true);
			return;
		}
		if (data.elementWordSize === 4) {
			view.setInt32(data.byteAddress, value, true);
			return;
		}
		throw new Error(`Unsupported integer element size for ${data.id}: ${data.elementWordSize}`);
	}

	if (data.elementWordSize === 8 || data.isFloat64) {
		view.setFloat64(data.byteAddress, value, true);
		return;
	}

	view.setFloat32(data.byteAddress, value, true);
}

function readValue(view: DataView, data: DataStructure): number | number[] {
	if (data.numberOfElements === 1) {
		return readScalar(view, data);
	}

	const values: number[] = [];
	for (let i = 0; i < data.numberOfElements; i += 1) {
		const elementData = { ...data, numberOfElements: 1, byteAddress: data.byteAddress + i * data.elementWordSize };
		values.push(readScalar(view, elementData));
	}

	return values;
}

function writeValue(view: DataView, data: DataStructure, value: number | number[]): void {
	if (data.numberOfElements === 1) {
		if (typeof value !== 'number') {
			throw new Error(`Expected scalar value for ${data.id}`);
		}
		writeScalar(view, data, value);
		return;
	}

	if (!Array.isArray(value)) {
		throw new Error(`Expected array value for ${data.id}`);
	}

	if (value.length !== data.numberOfElements) {
		throw new Error(`Expected ${data.numberOfElements} values for ${data.id}, got ${value.length}`);
	}

	for (let i = 0; i < value.length; i += 1) {
		const elementData = { ...data, numberOfElements: 1, byteAddress: data.byteAddress + i * data.elementWordSize };
		writeScalar(view, elementData, value[i]);
	}
}

function writeBytes(view: DataView, data: DataStructure, bytes: Uint8Array): void {
	const capacityBytes = data.numberOfElements * data.elementWordSize;
	if (bytes.byteLength > capacityBytes) {
		throw new Error(`Binary payload for ${data.id} is too large: ${bytes.byteLength} > ${capacityBytes} bytes`);
	}

	const target = new Uint8Array(view.buffer, data.byteAddress, capacityBytes);
	target.fill(0);
	target.set(bytes);
}

function readBytes(view: DataView, data: DataStructure): Uint8Array {
	const lengthBytes = data.numberOfElements * data.elementWordSize;
	const source = new Uint8Array(view.buffer, data.byteAddress, lengthBytes);
	return Uint8Array.from(source);
}

function createWebAssemblyMemory(requiredMemoryBytes: number): WebAssemblyMemoryLike {
	const memorySizePages = Math.max(1, Math.ceil(requiredMemoryBytes / 65536));
	return new (getWebAssemblyApi().Memory)({
		initial: memorySizePages,
		maximum: memorySizePages,
		shared: false,
	});
}

function getRegionName(memoryIndex: number, memoryRegions: string[] | undefined): string {
	return memoryRegions?.[memoryIndex - 1] ?? `memory${memoryIndex}`;
}

function getRegionMemoryImportNames(
	compiledModules: CreateRuntimeRunnerOptions['compiledModules'],
	memoryRegions: string[] | undefined,
	requiredMemoryBytesByRegion: Record<string, number> | undefined
): string[] {
	const names = new Set(Object.keys(requiredMemoryBytesByRegion ?? {}));

	const addRegion = (memoryIndex: number | undefined, memoryRegionName: string | undefined): void => {
		const resolvedMemoryIndex = memoryIndex ?? 0;
		if (resolvedMemoryIndex === 0) {
			return;
		}
		names.add(memoryRegionName ?? getRegionName(resolvedMemoryIndex, memoryRegions));
	};

	for (const module of Object.values(compiledModules)) {
		addRegion(module.memoryIndex, module.memoryRegionName);
		for (const data of Object.values(module.memoryMap)) {
			addRegion(data.memoryIndex, data.memoryRegionName);
		}
		for (const resource of Object.values(module.internalResources ?? {})) {
			addRegion(resource.memoryIndex, resource.memoryRegionName);
		}
	}

	return [...names];
}

function getMemoryView(
	data: DataStructure,
	defaultView: DataView,
	regionViews: Record<string, DataView>,
	memoryRegions: string[] | undefined
): DataView {
	const memoryIndex = data.memoryIndex ?? 0;
	if (memoryIndex === 0) {
		return defaultView;
	}
	return regionViews[data.memoryRegionName ?? getRegionName(memoryIndex, memoryRegions)];
}

export async function createRuntimeRunner(options: CreateRuntimeRunnerOptions): Promise<RuntimeRunner> {
	const lookup: MemoryLookup = createMemoryLookup(options.compiledModules);
	const memory = createWebAssemblyMemory(options.requiredMemoryBytes);
	const regionMemories = Object.fromEntries(
		getRegionMemoryImportNames(options.compiledModules, options.memoryRegions, options.requiredMemoryBytesByRegion).map(
			regionName => [regionName, createWebAssemblyMemory(options.requiredMemoryBytesByRegion?.[regionName] ?? 0)]
		)
	);
	const program = Buffer.from(options.compiledWasmBase64, 'base64');
	const { instance } = await getWebAssemblyApi().instantiate(program, {
		js: { memory, ...regionMemories },
	});
	const view = new DataView(memory.buffer);
	const regionViews = Object.fromEntries(
		Object.entries(regionMemories).map(([regionName, regionMemory]) => [regionName, new DataView(regionMemory.buffer)])
	);

	const init = instance.exports.init as () => void;
	const cycle = instance.exports.cycle as () => void;

	return {
		initialize(): void {
			init();
		},
		runCycles(count: number): void {
			for (let i = 0; i < count; i += 1) {
				cycle();
			}
		},
		read(id: string): number | number[] {
			const resolved = lookup.resolve(id);
			return readValue(getMemoryView(resolved.data, view, regionViews, options.memoryRegions), resolved.data);
		},
		readBytes(id: string): Uint8Array {
			const resolved = lookup.resolve(id);
			return readBytes(getMemoryView(resolved.data, view, regionViews, options.memoryRegions), resolved.data);
		},
		write(id: string, value: number | number[]): void {
			const resolved = lookup.resolve(id);
			writeValue(getMemoryView(resolved.data, view, regionViews, options.memoryRegions), resolved.data, value);
		},
		writeBytes(id: string, bytes: Uint8Array): void {
			const resolved = lookup.resolve(id);
			writeBytes(getMemoryView(resolved.data, view, regionViews, options.memoryRegions), resolved.data, bytes);
		},
	};
}
